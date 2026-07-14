import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { logError } from "@/lib/logger";
import { sendEmail, templates } from "@/lib/email";

/**
 * Webhook ZumboPay → activa subscrições e compras avulsas (serviço/pacote).
 *
 * Assinatura: X-Signature = hex(hmac_sha256(`${X-Timestamp}.${rawBody}`, secret))
 * Camadas de segurança (espelham o padrão oficial da ZumboPay):
 *   1) HMAC SHA-256
 *   2) Freshness — janela de 5 min (X-Timestamp)
 *   3) Idempotência por event_id (tabela zumbopay_processed_events)
 *   4) Re-verificação server-to-server — GET /payments/{reference}
 *   5) Cross-check de valor contra o preço já resolvido no servidor na
 *      criação do pagamento (nunca contra um valor fixo nem o payload)
 *   6) Guard e-Mola — nunca marca pago sem prova de PIN confirmado
 *
 * A referência é única em "subscricoes" e em "compras" (índices únicos),
 * por isso a procura por referencia nas duas tabelas é inequívoca — não é
 * preciso uma tabela de mapeamento adicional.
 */
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ZUMBOPAY_API_URL = "https://zumbopay.com/api/public/v1";
const MAX_SKEW_MS = 5 * 60 * 1000;

function verifySignature(rawBody: string, timestamp: string, signature: string): boolean {
  const secret = process.env.ZUMBOPAY_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) return false;
  const sig = signature.replace(/^sha256=/i, "").trim();
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function emolaPinConfirmed(auth: Record<string, unknown>): boolean {
  if (auth.pin_verified || auth.pin_confirmed || auth.pin_confirmed_at) return true;
  const providerStatus = String(auth.provider_status ?? "").toUpperCase();
  if (["PIN_CONFIRMED", "COMPLETED_WITH_PIN", "AUTHORIZED_BY_PIN", "SUCCESS"].includes(providerStatus)) return true;
  const meta = auth.metadata as Record<string, unknown> | undefined;
  if (meta && (meta.pin_verified || meta.emola_pin_ok)) return true;
  return false;
}

type Subscricao = { id: string; user_id: string; status: string; valor_mt: number; metodo_pag: string };
type Compra = { id: string; user_id: string; tipo: string; status: string; preco_mt: number; metodo_pag: string };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";
  const timestamp = req.headers.get("x-timestamp") ?? "";

  if (!signature || !timestamp) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 401 });
  }
  const tsNum = Number(timestamp);
  if (!tsNum || Math.abs(Date.now() - tsNum) > MAX_SKEW_MS) {
    return NextResponse.json({ ok: false, error: "stale_timestamp" }, { status: 401 });
  }
  if (!verifySignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const event = String(payload.event ?? payload.type ?? "").toLowerCase();
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const reference = String(data.reference ?? data.payment_reference ?? "");
  const eventId = String(payload.id ?? payload.event_id ?? `${event}:${reference}`);

  if (!reference) return NextResponse.json({ ok: false, error: "missing_reference" }, { status: 400 });

  // Idempotência — evita reprocessar o mesmo evento
  const { data: already } = await sb
    .from("zumbopay_processed_events")
    .select("event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (already) return NextResponse.json({ ok: true, duplicate: true });

  // Procura a referência em subscricoes; se não encontrar, em compras.
  const { data: subscricaoData } = await sb
    .from("subscricoes")
    .select("id, user_id, status, valor_mt, metodo_pag")
    .eq("referencia", reference)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sub = subscricaoData as Subscricao | null;
  let compra: Compra | null = null;

  if (!sub) {
    const { data: compraData } = await sb
      .from("compras")
      .select("id, user_id, tipo, status, preco_mt, metodo_pag")
      .eq("referencia", reference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    compra = compraData as Compra | null;
  }

  if (!sub && !compra) {
    return NextResponse.json({ ok: false, error: "purchase_not_found" }, { status: 404 });
  }

  const userId = sub ? sub.user_id : compra!.user_id;
  const metodoPag = sub ? sub.metodo_pag : compra!.metodo_pag;
  const expectedAmount = sub ? sub.valor_mt : compra!.preco_mt;
  const jaActivo = sub ? sub.status === "ativa" : compra!.status === "concluida";

  if (jaActivo) {
    await sb.from("zumbopay_processed_events").insert({ event_id: eventId }).select().maybeSingle();
    return NextResponse.json({ ok: true, already_active: true });
  }

  // Re-verificação server-to-server — nunca confiar cegamente no payload do webhook
  const apiKey = process.env.ZUMBOPAY_API_KEY;
  if (!apiKey) {
    console.error("ZUMBOPAY_API_KEY não configurada no webhook");
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }
  const verifyRes = await fetch(`${ZUMBOPAY_API_URL}/payments/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const verifyBody = await verifyRes.json().catch(() => ({}));
  const auth = (verifyBody?.data ?? verifyBody?.payment) as Record<string, unknown> | undefined;
  if (!auth) {
    await logError({ route: "/api/zumbopay/webhook", message: "Re-verificação falhou", detail: verifyBody, statusCode: verifyRes.status });
    return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 502 });
  }

  const authStatus = String(auth.status ?? "").toLowerCase();
  const channel = String(auth.channel ?? auth.method ?? metodoPag).toLowerCase();

  if (["failed", "cancelled", "expired"].includes(authStatus)) {
    if (sub) {
      await sb.from("subscricoes").update({ status: "expirada", notas_admin: `ZumboPay: ${authStatus} (verificado)` }).eq("id", sub.id);
    } else {
      await sb.from("compras").update({ status: "expirada", notas_admin: `ZumboPay: ${authStatus} (verificado)` }).eq("id", compra!.id);
    }
    await sb.from("zumbopay_processed_events").insert({ event_id: eventId }).select().maybeSingle();
    return NextResponse.json({ ok: true, status: authStatus });
  }
  if (!["success", "completed", "paid"].includes(authStatus)) {
    return NextResponse.json({ ok: true, status: authStatus, pending: true });
  }

  // Guard e-Mola — nunca marcar pago sem prova de PIN confirmado
  if (channel === "emola" && !emolaPinConfirmed(auth)) {
    return NextResponse.json({ ok: true, pending: true, reason: "emola_pin_not_confirmed" }, { status: 202 });
  }

  // Cross-check de valor — contra o preço resolvido no servidor na criação, nunca um valor fixo
  const authAmount = Number(auth.amount ?? 0);
  if (Math.abs(authAmount - expectedAmount) > 0.01) {
    await logError({ route: "/api/zumbopay/webhook", message: "amount_mismatch", detail: { esperado: expectedAmount, recebido: authAmount, reference }, userId });
    return NextResponse.json({ ok: false, error: "amount_mismatch" }, { status: 409 });
  }

  if (sub) {
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 30 * 86400000);
    await sb.from("subscricoes").update({
      status: "ativa",
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      aprovado_em: inicio.toISOString(),
      notas_admin: `ZumboPay: pago e verificado (ref ${reference}, canal ${channel}).`,
    }).eq("id", sub.id);
  } else {
    await sb.from("compras").update({
      status: "concluida",
      concluida_em: new Date().toISOString(),
      notas_admin: `ZumboPay: pago e verificado (ref ${reference}, canal ${channel}).`,
    }).eq("id", compra!.id);
  }

  await sb.from("zumbopay_processed_events").insert({ event_id: eventId }).select().maybeSingle();

  // Notificação por email — falha aqui nunca deve afectar a activação já concluída
  try {
    const { data: authUser } = await sb.auth.admin.getUserById(userId);
    const { data: perfil } = await sb.from("perfis").select("nome").eq("id", userId).maybeSingle();
    const email = authUser?.user?.email;
    if (email) {
      const nome = (perfil as { nome: string | null } | null)?.nome ?? "";
      if (sub) {
        await sendEmail({ to: email, subject: "Acesso activado — MUIANGA Carreiras", html: templates.subscricaoActiva(nome) });
      }
    }
  } catch (e) {
    await logError({ route: "/api/zumbopay/webhook", message: "Falha ao enviar email de activação", detail: String(e), userId });
  }

  return NextResponse.json({ ok: true, user_id: userId });
}
