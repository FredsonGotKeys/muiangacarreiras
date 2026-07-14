import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Verificação server-side de direito de uso (compra avulsa ou pacote) —
 * mesma lógica de lib/use-entitlement.ts (client), mas para reforçar em
 * rotas de API que não devem confiar apenas na verificação do browser.
 */
export async function hasEntitlement(userId: string, servicoSlug: string): Promise<boolean> {
  const { data: servico } = await sb
    .from("catalogo_itens")
    .select("id")
    .eq("tipo", "servico")
    .eq("slug", servicoSlug)
    .eq("activo", true)
    .maybeSingle();
  if (!servico) return false;
  const servicoId = (servico as { id: string }).id;

  const { data: links } = await sb.from("pacote_servicos").select("pacote_id").eq("servico_id", servicoId);
  const idsRelevantes = [servicoId, ...((links ?? []) as { pacote_id: string }[]).map((l) => l.pacote_id)];

  const { data: compra } = await sb
    .from("compras").select("id").eq("status", "concluida").eq("user_id", userId).in("item_id", idsRelevantes).limit(1).maybeSingle();

  return !!compra;
}
