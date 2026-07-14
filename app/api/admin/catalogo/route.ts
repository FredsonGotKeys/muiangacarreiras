import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthed } from "@/lib/admin-auth";
import { str } from "@/lib/api-utils";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TIPOS_VALIDOS = new Set(["servico", "pacote", "plano_subscricao"]);

// GET — lista todo o catálogo (activo e inactivo) + junções pacote→serviços
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: itens } = await sb
    .from("catalogo_itens")
    .select("*")
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true });

  const { data: pacoteServicos } = await sb
    .from("pacote_servicos")
    .select("pacote_id, servico_id");

  return NextResponse.json({ itens: itens ?? [], pacoteServicos: pacoteServicos ?? [] });
}

// POST — criar, actualizar, activar/desactivar, eliminar, definir_servicos_pacote
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { action, id } = body as { action: string; id?: string };
  const ACOES_VALIDAS = new Set(["criar", "actualizar", "activar", "desactivar", "eliminar", "definir_servicos_pacote"]);
  if (!ACOES_VALIDAS.has(action)) {
    return NextResponse.json({ error: "Acção desconhecida." }, { status: 400 });
  }

  if (action === "criar") {
    const tipo = str(body.tipo, 30);
    const slug = str(body.slug, 100);
    const nome = str(body.nome, 200);
    const precoMt = Number(body.precoMt);
    const periodicidade = tipo === "plano_subscricao" ? "mensal" : null;

    if (!tipo || !TIPOS_VALIDOS.has(tipo) || !slug || !nome || !Number.isFinite(precoMt) || precoMt < 0) {
      return NextResponse.json({ error: "Campos obrigatórios em falta ou inválidos." }, { status: 400 });
    }

    const { data: existente } = await sb.from("catalogo_itens").select("id").eq("slug", slug).maybeSingle();
    if (existente) return NextResponse.json({ error: "Já existe um item com este slug." }, { status: 409 });

    const { data, error } = await sb.from("catalogo_itens").insert({
      tipo, slug, nome,
      descricao: str(body.descricao, 2000),
      preco_mt: precoMt,
      periodicidade,
      config: body.config && typeof body.config === "object" ? body.config : {},
      ordem: Number.isFinite(Number(body.ordem)) ? Number(body.ordem) : 0,
    }).select().maybeSingle();

    if (error) return NextResponse.json({ error: "Erro ao criar item." }, { status: 500 });
    return NextResponse.json({ ok: true, item: data });
  }

  if (!id) return NextResponse.json({ error: "id em falta." }, { status: 400 });

  if (action === "actualizar") {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.nome === "string") updates.nome = str(body.nome, 200);
    if (typeof body.descricao === "string") updates.descricao = str(body.descricao, 2000);
    if (body.precoMt !== undefined) {
      const precoMt = Number(body.precoMt);
      if (!Number.isFinite(precoMt) || precoMt < 0) return NextResponse.json({ error: "preco_mt inválido." }, { status: 400 });
      updates.preco_mt = precoMt;
    }
    if (body.config && typeof body.config === "object") updates.config = body.config;
    if (body.ordem !== undefined && Number.isFinite(Number(body.ordem))) updates.ordem = Number(body.ordem);

    const { error } = await sb.from("catalogo_itens").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: "Erro ao actualizar item." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "activar" || action === "desactivar") {
    await sb.from("catalogo_itens").update({ activo: action === "activar", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "eliminar") {
    const [{ count: nCompras }, { count: nSubs }] = await Promise.all([
      sb.from("compras").select("id", { count: "exact", head: true }).eq("item_id", id),
      sb.from("subscricoes").select("id", { count: "exact", head: true }).eq("plano_id", id),
    ]);
    if ((nCompras ?? 0) > 0 || (nSubs ?? 0) > 0) {
      return NextResponse.json({ error: "Item com histórico de compras/subscrições — desactiva em vez de eliminar." }, { status: 409 });
    }
    await sb.from("catalogo_itens").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "definir_servicos_pacote") {
    const servicoIds = Array.isArray(body.servicoIds) ? body.servicoIds.filter((v: unknown) => typeof v === "string") : null;
    if (!servicoIds) return NextResponse.json({ error: "servicoIds em falta." }, { status: 400 });

    await sb.from("pacote_servicos").delete().eq("pacote_id", id);
    if (servicoIds.length > 0) {
      const { error } = await sb.from("pacote_servicos").insert(
        servicoIds.map((servicoId: string) => ({ pacote_id: id, servico_id: servicoId })),
      );
      if (error) return NextResponse.json({ error: "Erro ao definir serviços do pacote (verifica os tipos)." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
