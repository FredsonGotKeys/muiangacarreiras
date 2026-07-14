import { createClient } from "@supabase/supabase-js";

/**
 * Resolução de preço no servidor — nunca confiar num preço vindo do cliente.
 * O valor devolvido aqui é o único que se envia ao ZumboPay e se grava na BD.
 */
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type TipoCompra = "servico" | "pacote" | "plano_subscricao";

export interface ResolverPrecoInput {
  tipo: TipoCompra;
  itemId: string;
}

export interface ResolverPrecoOk {
  ok: true;
  item: { id: string; tipo: TipoCompra; slug: string; nome: string; precoMt: number };
}

export interface ResolverPrecoErro {
  ok: false;
  error: "item_nao_encontrado" | "item_inactivo";
}

export async function resolverPreco(
  input: ResolverPrecoInput,
): Promise<ResolverPrecoOk | ResolverPrecoErro> {
  const { data } = await sb
    .from("catalogo_itens")
    .select("id, tipo, slug, nome, preco_mt, activo")
    .eq("id", input.itemId)
    .eq("tipo", input.tipo)
    .maybeSingle();

  const item = data as { id: string; tipo: TipoCompra; slug: string; nome: string; preco_mt: number; activo: boolean } | null;

  // Item inexistente e item inactivo caem no mesmo erro de propósito —
  // não revela a existência de itens desactivados a quem está a tentar comprar.
  if (!item || !item.activo) {
    return { ok: false, error: "item_nao_encontrado" };
  }

  return {
    ok: true,
    item: {
      id: item.id,
      tipo: item.tipo,
      slug: item.slug,
      nome: item.nome,
      precoMt: Number(item.preco_mt),
    },
  };
}
