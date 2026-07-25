import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ZUMBOPAY_API_URL = "https://zumbopay.com/api/public/v1";

/**
 * Consulta o estado de uma compra avulsa (serviço ou pacote) do
 * utilizador. NÃO activa nada — isso continua a ser responsabilidade
 * exclusiva do webhook ZumboPay (que verifica HMAC + faz o cross-check de
 * valor). Mas, para reagir depressa a um cancelamento — que o operador
 * às vezes não reporta via webhook, só fica visível ao consultar o
 * pagamento directamente — esta rota também pergunta à própria ZumboPay
 * pelo estado da referência em vez de esperar cegamente pelo webhook.
 */
async function statusDirectoZumboPay(reference: string): Promise<string | null> {
  const apiKey = process.env.ZUMBOPAY_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${ZUMBOPAY_API_URL}/payments/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    const auth = (body?.data ?? body?.payment) as Record<string, unknown> | undefined;
    return auth ? String(auth.status ?? "").toLowerCase() : null;
  } catch {
    return null;
  }
}
export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 30))) return rateLimitedResponse();

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const sbUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sbUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const { data: perfil } = await sb
    .from("perfis")
    .select("bloqueado")
    .eq("id", user.id)
    .maybeSingle();
  if ((perfil as { bloqueado: boolean } | null)?.bloqueado) {
    return NextResponse.json({ status: "blocked", error: "Conta bloqueada." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const tipo = str(body?.tipo, 30);
  const itemId = str(body?.itemId, 100);

  if ((tipo !== "servico" && tipo !== "pacote") || !itemId) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { data: compra } = await sb
    .from("compras")
    .select("id, status, notas_admin, referencia, created_at")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const c = compra as { id: string; status: string; notas_admin: string | null; referencia: string | null; created_at: string } | null;
  if (c?.status === "concluida") return NextResponse.json({ status: "active" });

  // O webhook marca "expirada" assim que o operador (ZumboPay) confirma
  // failed/cancelled/expired — reportar isso já em vez de deixar o
  // frontend continuar a fazer polling até ao limite de 2 minutos.
  if (c?.status === "expirada") return NextResponse.json({ status: "cancelled", detalhe: c.notas_admin ?? undefined });

  // Fallback: se ainda "pendente" há mais de 5s, pergunta directamente à
  // ZumboPay em vez de esperar só pelo webhook — nem todo cancelamento
  // gera um evento de webhook, mas a consulta directa reflecte sempre o
  // estado real do lado deles.
  if (c?.status === "pendente" && c.referencia && Date.now() - new Date(c.created_at).getTime() > 5000) {
    const authStatus = await statusDirectoZumboPay(c.referencia);
    if (authStatus && ["failed", "cancelled", "expired"].includes(authStatus)) {
      await sb.from("compras").update({ status: "expirada", notas_admin: `ZumboPay: ${authStatus} (consulta directa)` }).eq("id", c.id);
      return NextResponse.json({ status: "cancelled" });
    }
  }

  return NextResponse.json({ status: "pending" });
}
