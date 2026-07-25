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
 * do site — confirma no telemóvel e o pagamento activa via webhook. Sem
 * cartão: o valor mínimo do checkout de cartão da ZumboPay (100 MT) é
 * superior ao preço do passe (59 MT), por isso só M-Pesa/e-Mola fazem
 * sentido aqui.
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
const METODOS = new Set(["mpesa", "emola"]);
const TIPOS = new Set<TipoCompra>(["servico", "pacote"]);

// Planos de numeração móvel de Moçambique — o STK/USSD só chega se o
// número pertencer mesmo à rede do método escolhido (e-Mola é Movitel,
// M-Pesa é Vodacom); validar isto no servidor também, não só no cliente.
const PREFIXOS_REDE: Record<string, string[]> = {
  mpesa: ["84", "85"],
  emola: ["86", "87"],
};

function walletIdFor(metodo: string): string | undefined {
  if (metodo === "mpesa") return process.env.ZUMBOPAY_WALLET_MPESA;
  if (metodo === "emola") return process.env.ZUMBOPAY_WALLET_EMOLA;
  return undefined;
}

/**
 * A ZumboPay às vezes devolve o erro interno em bruto do seu próprio
 * servidor (ex.: falhas de ligação à base de dados deles) em vez de uma
 * mensagem para o utilizador final. Nesses casos, mostrar isso tal como
 * está só confunde — troca-se por uma mensagem honesta e útil.
 */
const PADRAO_ERRO_INTERNO = /sqlstate|erro de liga[çc][ãa]o|access denied|database|incorrect database|^http \d+$/i;

function mensagemErroOperador(desc: string, metodo: string): string {
  if (!PADRAO_ERRO_INTERNO.test(desc)) return desc;
  const nomeMetodo = metodo === "mpesa" ? "M-Pesa" : "e-Mola";
  const alternativa = metodo === "mpesa" ? "e-Mola" : "M-Pesa";
  return `${nomeMetodo} está indisponível de momento (falha no operador de pagamento). Tenta ${alternativa} ou volta a tentar dentro de alguns minutos.`;
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
  const telefone = (str(body?.telefone, 20) ?? perfilTyped?.telefone ?? "").replace(/\D/g, "").slice(-9);

  if (!/^\d{9}$/.test(telefone)) {
    return NextResponse.json({ error: "Indica um número de telefone válido (9 dígitos)." }, { status: 400 });
  }
  if (!PREFIXOS_REDE[metodo].includes(telefone.slice(0, 2))) {
    const rede = metodo === "mpesa" ? "Vodacom (M-Pesa) — deve começar por 84 ou 85" : "Movitel (e-Mola) — deve começar por 86 ou 87";
    return NextResponse.json({ error: `Este número não parece ser ${rede}.` }, { status: 400 });
  }

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
      const descBruta = responseBody?.error?.message ?? data.description ?? data.code ?? "pagamento recusado pelo operador";
      await logError({ route: "/api/zumbopay/create", message: "charge rejeitado (failed)", detail: responseBody, userId: user.id, statusCode: res.status });
      return NextResponse.json({ error: mensagemErroOperador(String(descBruta), metodo) }, { status: 402 });
    }

    if (!reference) {
      const errMsg = String(responseBody?.error?.message ?? responseBody?.error ?? `HTTP ${res.status}`);
      await logError({ route: "/api/zumbopay/create", message: "charge sem reference", detail: responseBody, userId: user.id, statusCode: res.status });
      const mensagem = PADRAO_ERRO_INTERNO.test(errMsg)
        ? mensagemErroOperador(errMsg, metodo)
        : `Não foi possível iniciar o pagamento: ${errMsg}`;
      return NextResponse.json({ error: mensagem }, { status: 502 });
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
  } catch (e) {
    await logError({ route: "/api/zumbopay/create", message: "erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
