import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * Leitura do catálogo comercial a partir do browser — usa a RLS
 * "public_read_active" (qualquer pessoa lê itens activos, sem chave
 * privada). Nunca usar isto para decidir preço a pagar: o preço final
 * é sempre resolvido de novo no servidor (lib/pricing.ts) na criação
 * do pagamento.
 */
const sb = getSupabaseBrowser();

export type TipoCatalogo = "servico" | "pacote" | "plano_subscricao";

export interface CatalogoItem {
  id: string;
  tipo: TipoCatalogo;
  slug: string;
  nome: string;
  descricao: string | null;
  preco_mt: number;
  periodicidade: string | null;
}

export async function getCatalogoItem(tipo: TipoCatalogo, slug: string): Promise<CatalogoItem | null> {
  const { data } = await sb
    .from("catalogo_itens")
    .select("id, tipo, slug, nome, descricao, preco_mt, periodicidade")
    .eq("tipo", tipo)
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();
  return data as CatalogoItem | null;
}

export async function listCatalogo(tipo?: TipoCatalogo): Promise<CatalogoItem[]> {
  let query = sb
    .from("catalogo_itens")
    .select("id, tipo, slug, nome, descricao, preco_mt, periodicidade")
    .eq("activo", true)
    .order("ordem", { ascending: true });
  if (tipo) query = query.eq("tipo", tipo);
  const { data } = await query;
  return (data as CatalogoItem[] | null) ?? [];
}

export async function listPacotesComServico(servicoId: string): Promise<CatalogoItem[]> {
  const { data: links } = await sb.from("pacote_servicos").select("pacote_id").eq("servico_id", servicoId);
  const pacoteIds = (links ?? []).map((l) => (l as { pacote_id: string }).pacote_id);
  if (pacoteIds.length === 0) return [];
  const { data } = await sb
    .from("catalogo_itens")
    .select("id, tipo, slug, nome, descricao, preco_mt, periodicidade")
    .in("id", pacoteIds)
    .eq("activo", true)
    .order("preco_mt", { ascending: true });
  return (data as CatalogoItem[] | null) ?? [];
}
