import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Consulta o estado de uma compra avulsa (serviço ou pacote) do
 * utilizador. NÃO activa nada — isso é responsabilidade exclusiva do
 * webhook ZumboPay (HMAC + frescura + idempotência + cross-check de
 * valor). Esta rota é só leitura da tabela `compras`, e é o que o
 * frontend faz polling enquanto espera a confirmação.
 *
 * Nota: houve aqui uma tentativa de consultar a ZumboPay directamente a
 * cada sondagem, para apanhar cancelamentos mais depressa. Foi removida:
 * `GET /payments/{ref}` só serve LINKS de pagamento (`ZP-LNK-...`) e
 * devolve sempre 404 para uma cobrança STK (`ZUMBO...`), que é o único
 * método aqui usado. Na prática era uma chamada de rede a cada 2s que
 * nunca podia devolver nada — os cancelamentos chegam pelo webhook, que
 * marca a compra como "expirada".
 */
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
    .select("status, notas_admin")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const c = compra as { status: string; notas_admin: string | null } | null;
  if (c?.status === "concluida") return NextResponse.json({ status: "active" });

  // O webhook marca "expirada" assim que a ZumboPay confirma
  // failed/cancelled/expired — reportar isso já em vez de deixar o
  // frontend continuar a fazer polling até ao limite.
  if (c?.status === "expirada") return NextResponse.json({ status: "cancelled", detalhe: c.notas_admin ?? undefined });

  return NextResponse.json({ status: "pending" });
}
