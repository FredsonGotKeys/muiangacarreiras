import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logger";
import { sendEmail, templates } from "@/lib/email";
import { verificarPagamento } from "@/lib/zumbopay-verificacao";
import {
  assinaturaValida,
  lerCabecalho,
  CABECALHOS_ASSINATURA,
  CABECALHOS_TIMESTAMP,
} from "@/lib/zumbopay-cabecalhos";
import { extrairEvento, extrairReferencia, extrairEventId } from "@/lib/zumbopay-payload";

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

const MAX_SKEW_MS = 5 * 60 * 1000;

function verifySignature(rawBody: string, timestamp: string, signature: string): boolean {
  return assinaturaValida(rawBody, timestamp, signature, process.env.ZUMBOPAY_WEBHOOK_SECRET);
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

/**
 * Regista uma rejeição à entrada do webhook. Sem isto era impossível
 * distinguir "a ZumboPay nunca chamou o webhook" de "chamou e foi
 * recusada logo à porta" — os dois cenários eram silenciosos e
 * indistinguíveis, o que tornava qualquer diagnóstico de pagamento um
 * exercício de adivinhação.
 */
async function recusar(motivo: string, status: number, detalhe?: unknown) {
  await logError({ route: "/api/zumbopay/webhook", message: `recusado: ${motivo}`, detail: detalhe, statusCode: status });
  return NextResponse.json({ ok: false, error: motivo }, { status });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = lerCabecalho(req.headers, CABECALHOS_ASSINATURA);
  const timestamp = lerCabecalho(req.headers, CABECALHOS_TIMESTAMP);

  if (!signature) {
    return recusar("missing_signature", 401, {
      cabecalhos: [...req.headers.keys()].filter((h) => /zumbo|signature|timestamp/i.test(h)),
    });
  }

  // O timestamp serve só para a janela de frescura. Se a ZumboPay não o
  // enviar, a assinatura sozinha continua a provar autenticidade — não
  // vale a pena recusar um pagamento legítimo por causa disso.
  if (timestamp) {
    // Aceita segundos ou milissegundos (a convenção varia).
    const bruto = Number(timestamp);
    const tsMs = bruto > 1e12 ? bruto : bruto * 1000;
    if (!bruto || Math.abs(Date.now() - tsMs) > MAX_SKEW_MS) {
      return recusar("stale_timestamp", 401, { timestamp, desvioMs: bruto ? Date.now() - tsMs : null });
    }
  }
  if (!verifySignature(rawBody, timestamp, signature)) {
    const secret = process.env.ZUMBOPAY_WEBHOOK_SECRET;
    return recusar("invalid_signature", 401, {
      // Nunca registar o segredo nem a assinatura recebida — só o que
      // permite diagnosticar (segredo em falta vs. assinatura errada).
      segredoConfigurado: !!secret && secret.length >= 16,
      tamanhoAssinatura: signature.replace(/^sha256=/i, "").trim().length,
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return recusar("invalid_json", 400, rawBody.slice(0, 200));
  }

  const data = (payload.data ?? payload) as Record<string, unknown>;
  const event = extrairEvento(payload, req.headers.get("x-zumbopay-event"));
  const reference = extrairReferencia(payload);
  const eventId = extrairEventId(payload, req.headers.get("x-zumbopay-delivery"), event, reference);

  /**
   * Confirma a recepção sem processar. Usa-se quando o evento é
   * legítimo mas não nos diz respeito (ex.: um pagamento feito através
   * de um link da ZumboPay, que não corresponde a nenhuma compra
   * nossa). Tem de devolver 2xx: com um código de erro, a ZumboPay
   * assume falha de entrega e retenta indefinidamente — era o que
   * estava a acontecer, com o mesmo evento a chegar de 5 em 5 minutos.
   * Fica registado uma vez para haver rasto, e a idempotência impede
   * que volte a ser tratado.
   */
  async function reconhecerSemProcessar(motivo: string, detalhe?: unknown) {
    await logError({ route: "/api/zumbopay/webhook", message: `ignorado: ${motivo}`, detail: detalhe });
    if (eventId) {
      await sb.from("zumbopay_processed_events").insert({ event_id: eventId }).select().maybeSingle();
    }
    return NextResponse.json({ ok: true, ignored: motivo });
  }

  if (!reference) return reconhecerSemProcessar("missing_reference", payload);

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
    // Não é um erro nosso: a referência é válida mas não pertence a
    // nenhuma compra deste site (tipicamente um pagamento feito pelo
    // link da ZumboPay). Reconhece-se para a entrega não ficar em
    // retentativa perpétua.
    return reconhecerSemProcessar("purchase_not_found", { reference, event });
  }

  const userId = sub ? sub.user_id : compra!.user_id;
  const metodoPag = sub ? sub.metodo_pag : compra!.metodo_pag;
  const expectedAmount = sub ? sub.valor_mt : compra!.preco_mt;
  const jaActivo = sub ? sub.status === "ativa" : compra!.status === "concluida";

  if (jaActivo) {
    await sb.from("zumbopay_processed_events").insert({ event_id: eventId }).select().maybeSingle();
    return NextResponse.json({ ok: true, already_active: true });
  }

  const apiKey = process.env.ZUMBOPAY_API_KEY;
  if (!apiKey) {
    console.error("ZUMBOPAY_API_KEY não configurada no webhook");
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const verificacao = await verificarPagamento(reference, apiKey, data);
  if (!verificacao.ok) {
    await logError({ route: "/api/zumbopay/webhook", message: "Re-verificação falhou", detail: verificacao.detalhe, statusCode: verificacao.status });
    return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 502 });
  }
  const auth = verificacao.dados;
  // Fica registado nas notas para auditoria: "api" = confirmado por
  // consulta independente à ZumboPay; "payload" = confirmado pelo evento
  // assinado (cobrança STK, que não tem endpoint de consulta).
  const fonte = verificacao.fonte === "api" ? "consulta directa" : "evento assinado";

  const authStatus = String(auth.status ?? "").toLowerCase();
  const channel = String(auth.channel ?? auth.method ?? metodoPag).toLowerCase();

  if (["failed", "cancelled", "expired"].includes(authStatus)) {
    if (sub) {
      await sb.from("subscricoes").update({ status: "expirada", notas_admin: `ZumboPay: ${authStatus} (${fonte})` }).eq("id", sub.id);
    } else {
      await sb.from("compras").update({ status: "expirada", notas_admin: `ZumboPay: ${authStatus} (${fonte})` }).eq("id", compra!.id);
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
      notas_admin: `ZumboPay: pago e verificado por ${fonte} (ref ${reference}, canal ${channel}).`,
    }).eq("id", sub.id);
  } else {
    // Modelo actual: um único produto vendável ("Acesso Total") — o
    // pagamento confirmado desbloqueia tudo no site por 8 horas a partir de agora.
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 8 * 3600000);
    await sb.from("compras").update({
      status: "concluida",
      concluida_em: agora.toISOString(),
      expira_em: expiraEm.toISOString(),
      notas_admin: `ZumboPay: pago e verificado por ${fonte} (ref ${reference}, canal ${channel}).`,
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
