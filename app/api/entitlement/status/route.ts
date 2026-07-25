import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { entitlementRow } from "@/lib/entitlement-server";

/**
 * Fonte de verdade para "estás desbloqueado?" — usa o relógio do
 * servidor, nunca o do browser (lib/use-entitlement.ts consome esta
 * rota em vez de consultar `compras` directamente do cliente, que
 * comparava contra `new Date()` do dispositivo do utilizador).
 */
export async function GET(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 30))) return rateLimitedResponse();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const row = await entitlementRow(user.id);
  return NextResponse.json({ unlocked: !!row, expiraEm: row?.expira_em ?? null });
}
