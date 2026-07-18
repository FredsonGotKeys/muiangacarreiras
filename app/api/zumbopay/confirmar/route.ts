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
 * webhook ZumboPay (que verifica HMAC + re-confirma server-to-server).
 * Apenas leitura. O frontend faz polling depois de iniciar o pagamento
 * (STK push ou redirect).
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
    .select("status")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = (compra as { status: string } | null)?.status;
  if (status === "concluida") return NextResponse.json({ status: "active" });
  return NextResponse.json({ status: "pending" });
}
