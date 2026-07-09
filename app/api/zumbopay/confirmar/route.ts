import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Consulta o estado da subscrição do utilizador.
 * NÃO cria subscrição — isso é responsabilidade exclusiva do webhook ZumboPay
 * (que verifica HMAC + re-confirma server-to-server). Apenas leitura.
 *
 * O frontend faz polling depois de iniciar o pagamento (STK push ou redirect).
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 30)) return rateLimitedResponse();

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

  const { data: sub } = await sb
    .from("subscricoes")
    .select("status, fim")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const fim = (sub as { fim: string | null } | null)?.fim;
  const ativa =
    (sub as { status: string } | null)?.status === "ativa" &&
    (!fim || new Date(fim).getTime() > now);

  if (ativa) return NextResponse.json({ status: "active", fim });
  return NextResponse.json({ status: "pending" });
}
