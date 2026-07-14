import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { hasEntitlement } from "@/lib/entitlement-server";

/**
 * Guarda um documento gerado (CV, carta, requerimento, etc.) na Storage
 * privada para o utilizador poder re-descarregar depois sem gerar (e sem
 * pagar) de novo — "paga a criação, não o download".
 */
const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TIPOS = new Set([
  "cv", "carta-apresentacao", "carta-motivacao", "requerimento",
  "conversao-ats", "traducao-cv", "simulacao-entrevista", "analise-cv",
]);

// Serviço que desbloqueia cada tipo de documento — usado para reverificar
// direito de uso no servidor (nunca confiar apenas na verificação do browser).
const SERVICO_POR_TIPO: Record<string, string> = {
  "cv": "criar-cv-ia",
  "carta-apresentacao": "carta-apresentacao",
  "carta-motivacao": "carta-motivacao",
  "requerimento": "requerimento",
  "conversao-ats": "conversao-ats",
  "traducao-cv": "traducao-cv",
  "simulacao-entrevista": "simulacao-entrevista",
  "analise-cv": "analise-cv",
};

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 10)) return rateLimitedResponse();

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const sbUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sbUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const tipo = str(formData.get("tipo"), 30);
  const nomeFicheiro = str(formData.get("nomeFicheiro"), 200);
  const ficheiro = formData.get("ficheiro") as File | null;

  if (!tipo || !TIPOS.has(tipo) || !nomeFicheiro || !ficheiro) {
    return NextResponse.json({ error: "Dados do documento em falta." }, { status: 400 });
  }
  if (ficheiro.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Ficheiro demasiado grande." }, { status: 400 });
  }

  const servicoSlug = SERVICO_POR_TIPO[tipo];
  const autorizado = await hasEntitlement(user.id, servicoSlug);
  if (!autorizado) {
    return NextResponse.json({ error: "Sem direito de uso para este serviço." }, { status: 403 });
  }

  const buffer = Buffer.from(await ficheiro.arrayBuffer());
  const path = `${user.id}/${tipo}/${Date.now()}-${nomeFicheiro.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;

  const { error: uploadErr } = await sbAdmin.storage
    .from("documentos")
    .upload(path, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false,
    });
  if (uploadErr) {
    return NextResponse.json({ error: "Erro ao guardar documento." }, { status: 500 });
  }

  // Liga ao registo de compra mais recente e concluída deste serviço, se existir
  const { data: catalogoItem } = await sbAdmin.from("catalogo_itens").select("id").eq("tipo", "servico").eq("slug", servicoSlug).maybeSingle();
  let compraId: string | null = null;
  if (catalogoItem) {
    const { data: compra } = await sbAdmin
      .from("compras")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", (catalogoItem as { id: string }).id)
      .eq("status", "concluida")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    compraId = (compra as { id: string } | null)?.id ?? null;
  }

  const { data: doc, error: insertErr } = await sbAdmin.from("documentos_gerados").insert({
    user_id: user.id,
    tipo,
    nome_ficheiro: nomeFicheiro,
    storage_path: path,
    compra_id: compraId,
  }).select("id").maybeSingle();

  if (insertErr) {
    await sbAdmin.storage.from("documentos").remove([path]).catch(() => {});
    return NextResponse.json({ error: "Erro ao registar documento." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: (doc as { id: string } | null)?.id });
}
