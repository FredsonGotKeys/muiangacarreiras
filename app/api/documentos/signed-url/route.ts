import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Gera uma URL assinada (5 min) para re-descarregar um documento já pago. */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 20))) return rateLimitedResponse();

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
  const id = str(body?.id, 100);
  if (!id) return NextResponse.json({ error: "id em falta." }, { status: 400 });

  const { data: doc } = await sbAdmin
    .from("documentos_gerados")
    .select("storage_path, user_id")
    .eq("id", id)
    .maybeSingle();

  const docTyped = doc as { storage_path: string; user_id: string } | null;
  if (!docTyped || docTyped.user_id !== user.id) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const { data, error } = await sbAdmin.storage.from("documentos").createSignedUrl(docTyped.storage_path, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Erro ao gerar URL." }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}
