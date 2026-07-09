import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

/**
 * Inicia um pagamento ZumboPay para a subscrição (199 MT / 30 dias).
 *
 * M-Pesa / e-Mola → STK push directo (POST /charges). O cliente nunca sai
 * do site — confirma no telemóvel e a subscrição activa via webhook.
 * Cartão → checkout hospedado (POST /payments), com redirect.
 *
 * A subscrição é criada aqui como "pendente" com a referência ZumboPay;
 * o webhook (única fonte que confirma pagamento) promove-a a "ativa".
 */
const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ZUMBOPAY_API_URL = "https://zumbopay.com/api/public/v1";
const METODOS = new Set(["mpesa", "emola", "card"]);
const VALOR_MT = 199;

function walletIdFor(metodo: string): string | undefined {
  if (metodo === "mpesa") return process.env.ZUMBOPAY_WALLET_MPESA;
  if (metodo === "emola") return process.env.ZUMBOPAY_WALLET_EMOLA;
  if (metodo === "card") return process.env.ZUMBOPAY_WALLET_CARD;
  return undefined;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 6)) return rateLimitedResponse();

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const sbUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sbUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const metodo = typeof body?.metodo === "string" ? body.metodo : "";
  if (!METODOS.has(metodo)) {
    return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
  }

  const apiKey = process.env.ZUMBOPAY_API_KEY;
  if (!apiKey) {
    console.error("ZUMBOPAY_API_KEY não configurada");
    return NextResponse.json({ error: "Servidor mal configurado." }, { status: 500 });
  }
  const walletId = walletIdFor(metodo);
  if (!walletId) {
    console.error(`Wallet ZumboPay não configurada para método: ${metodo}`);
    return NextResponse.json({ error: "Método temporariamente indisponível." }, { status: 503 });
  }

  const { data: perfil } = await sbAdmin
    .from("perfis")
    .select("nome, telefone, bloqueado")
    .eq("id", user.id)
    .maybeSingle();

  const perfilTyped = perfil as { nome: string | null; telefone: string | null; bloqueado: boolean } | null;
  if (perfilTyped?.bloqueado) {
    return NextResponse.json({ error: "Conta bloqueada. Contacta o suporte." }, { status: 403 });
  }

  const nome = perfilTyped?.nome ?? "Utilizador";
  let telefone = (str(body?.telefone, 20) ?? perfilTyped?.telefone ?? "").replace(/\D/g, "").slice(-9);

  if ((metodo === "mpesa" || metodo === "emola") && !/^\d{9}$/.test(telefone)) {
    return NextResponse.json({ error: "Indica um número de telefone válido (9 dígitos)." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const sourceId = `mc-${user.id.slice(0, 8)}-${Date.now()}`;

  try {
    // M-Pesa / e-Mola → STK push directo, sem redirect
    if (metodo === "mpesa" || metodo === "emola") {
      const res = await fetch(`${ZUMBOPAY_API_URL}/charges`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": sourceId,
        },
        body: JSON.stringify({
          wallet_id: walletId,
          amount: VALOR_MT,
          msisdn: telefone,
          customer_name: nome,
          source_id: sourceId,
        }),
      });

      const responseBody = await res.json().catch(() => ({}));
      const data = responseBody?.data ?? {};
      const reference: string | undefined = data.reference;
      const status = String(data.status ?? "").toLowerCase();

      if (!reference) {
        const errMsg = responseBody?.error?.message ?? responseBody?.error ?? `HTTP ${res.status}`;
        await logError({ route: "/api/zumbopay/create", message: "charge sem reference", detail: responseBody, userId: user.id, statusCode: res.status });
        return NextResponse.json({ error: `Não foi possível iniciar o pagamento: ${errMsg}` }, { status: 502 });
      }

      if (status === "failed") {
        const desc = data.description ?? data.code ?? "pagamento recusado";
        return NextResponse.json({ error: `Pagamento recusado: ${desc}` }, { status: 402 });
      }

      // Expirar subscrições pendentes antigas do utilizador e criar a nova
      await sbAdmin.from("subscricoes").update({ status: "expirada" })
        .eq("user_id", user.id).eq("status", "pendente");

      await sbAdmin.from("subscricoes").insert({
        user_id: user.id,
        status: status === "success" ? "ativa" : "pendente",
        metodo_pag: metodo,
        referencia: reference,
        numero_pag: telefone,
        valor_mt: VALOR_MT,
        ...(status === "success"
          ? { inicio: new Date().toISOString(), fim: new Date(Date.now() + 30 * 86400000).toISOString(), aprovado_em: new Date().toISOString() }
          : {}),
        notas_admin: `ZumboPay ${metodo} — ref: ${reference}`,
      });

      return NextResponse.json({
        mode: "direct",
        status: status === "success" ? "active" : "pending",
        reference,
        message: metodo === "emola"
          ? "Introduz o PIN e-Mola no teu telemóvel para confirmar."
          : "Confirma o pagamento M-Pesa no teu telemóvel.",
      });
    }

    // Cartão → checkout hospedado (3DS)
    const res = await fetch(`${ZUMBOPAY_API_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Idempotency-Key": sourceId,
      },
      body: JSON.stringify({
        type: "link",
        title: "Subscrição MUIANGA CARREIRAS",
        amount: VALOR_MT,
        currency: "MZN",
        channels: ["card"],
        wallet_id: walletId,
        description: `Subscrição mensal — ${nome}`,
        source: "muianga-carreiras",
        source_id: sourceId,
        return_url: `${siteUrl}/emprego?pagamento=sucesso`,
        callback_url: `${siteUrl}/emprego?pagamento=sucesso`,
      }),
    });

    const responseBody = await res.json().catch(() => ({}));
    const checkoutUrl = responseBody?.checkout_url ?? responseBody?.data?.checkout_url;
    const reference = responseBody?.data?.reference ?? responseBody?.reference;

    if (!checkoutUrl || !reference) {
      const errMsg = responseBody?.error?.message ?? responseBody?.error ?? `HTTP ${res.status}`;
      await logError({ route: "/api/zumbopay/create", message: "payment sem checkout_url", detail: responseBody, userId: user.id, statusCode: res.status });
      return NextResponse.json({ error: `Erro ao criar pagamento: ${errMsg}` }, { status: 502 });
    }

    await sbAdmin.from("subscricoes").update({ status: "expirada" })
      .eq("user_id", user.id).eq("status", "pendente");

    await sbAdmin.from("subscricoes").insert({
      user_id: user.id,
      status: "pendente",
      metodo_pag: "card",
      referencia: reference,
      valor_mt: VALOR_MT,
      notas_admin: `ZumboPay card — ref: ${reference}`,
    });

    return NextResponse.json({ mode: "redirect", checkoutUrl, reference });
  } catch (e) {
    await logError({ route: "/api/zumbopay/create", message: "erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
