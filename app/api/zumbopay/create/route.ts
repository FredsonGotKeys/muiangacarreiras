import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { resolverPreco, type TipoCompra } from "@/lib/pricing";

/**
 * Inicia um pagamento ZumboPay para um item do catálogo (serviço ou pacote,
 * pagamento único — não há planos de subscrição). O preço é sempre
 * resolvido no servidor via lib/pricing.ts — nunca confiado a partir do
 * corpo do pedido.
 *
 * M-Pesa / e-Mola → STK push directo (POST /charges). O cliente nunca sai
 * do site — confirma no telemóvel e o pagamento activa via webhook.
 * Cartão → checkout hospedado (POST /payments), com redirect.
 *
 * Insere em "compras" (direito permanente, sem janela). A linha nasce
 * "pendente"; o webhook (única fonte que confirma pagamento) promove-a
 * a "concluida".
 */
const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ZUMBOPAY_API_URL = "https://zumbopay.com/api/public/v1";
const METODOS = new Set(["mpesa", "emola", "card"]);
const TIPOS = new Set<TipoCompra>(["servico", "pacote"]);

function walletIdFor(metodo: string): string | undefined {
  if (metodo === "mpesa") return process.env.ZUMBOPAY_WALLET_MPESA;
  if (metodo === "emola") return process.env.ZUMBOPAY_WALLET_EMOLA;
  if (metodo === "card") return process.env.ZUMBOPAY_WALLET_CARD;
  return undefined;
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 6))) return rateLimitedResponse();

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
  const tipo = typeof body?.tipo === "string" ? (body.tipo as TipoCompra) : undefined;
  const itemId = str(body?.itemId, 100);
  if (!tipo || !TIPOS.has(tipo) || !itemId) {
    return NextResponse.json({ error: "Item de compra inválido." }, { status: 400 });
  }

  const preco = await resolverPreco({ tipo, itemId });
  if (!preco.ok) {
    return NextResponse.json({ error: "Item indisponível." }, { status: 400 });
  }
  const valorMt = preco.item.precoMt;

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

  /** Regista a compra pendente/concluída em "compras". */
  async function registarCompra(status: "pendente" | "ativa" | "concluida", reference: string) {
    await sbAdmin.from("compras").update({ status: "expirada" })
      .eq("user_id", user!.id).eq("item_id", itemId).eq("status", "pendente");

    await sbAdmin.from("compras").insert({
      user_id: user!.id,
      tipo,
      item_id: itemId,
      preco_mt: valorMt,
      status: status === "ativa" ? "concluida" : status,
      metodo_pag: metodo,
      referencia: reference,
      numero_pag: telefone || null,
      notas_admin: `ZumboPay ${metodo} — ref: ${reference}`,
      ...(status === "ativa" ? { concluida_em: new Date().toISOString() } : {}),
    });
  }

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
          amount: valorMt,
          msisdn: telefone,
          customer_name: nome,
          source_id: sourceId,
        }),
      });

      const responseBody = await res.json().catch(() => ({}));
      const data = responseBody?.data ?? {};
      const reference: string | undefined = data.reference;
      const status = String(data.status ?? "").toLowerCase();

      // A ZumboPay pode rejeitar o charge (status "failed") sem gerar referência —
      // verificar isto primeiro dá uma mensagem específica em vez do "HTTP xxx" genérico.
      if (status === "failed") {
        const desc = responseBody?.error?.message ?? data.description ?? data.code ?? "pagamento recusado pelo operador";
        await logError({ route: "/api/zumbopay/create", message: "charge rejeitado (failed)", detail: responseBody, userId: user.id, statusCode: res.status });
        return NextResponse.json({ error: `Pagamento recusado: ${desc}` }, { status: 402 });
      }

      if (!reference) {
        const errMsg = responseBody?.error?.message ?? responseBody?.error ?? `HTTP ${res.status}`;
        await logError({ route: "/api/zumbopay/create", message: "charge sem reference", detail: responseBody, userId: user.id, statusCode: res.status });
        return NextResponse.json({ error: `Não foi possível iniciar o pagamento: ${errMsg}` }, { status: 502 });
      }

      await registarCompra(status === "success" ? "ativa" : "pendente", reference);

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
        title: preco.item.nome,
        amount: valorMt,
        currency: "MZN",
        channels: ["card"],
        wallet_id: walletId,
        description: `${preco.item.nome} — ${nome}`,
        source: "muianga-carreiras",
        source_id: sourceId,
        return_url: `${siteUrl}/conta?pagamento=sucesso`,
        callback_url: `${siteUrl}/conta?pagamento=sucesso`,
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

    await registarCompra("pendente", reference);

    return NextResponse.json({ mode: "redirect", checkoutUrl, reference });
  } catch (e) {
    await logError({ route: "/api/zumbopay/create", message: "erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
