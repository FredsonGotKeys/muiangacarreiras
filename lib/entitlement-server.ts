import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Verificação server-side do passe de acesso total (59 MT / 8h, desbloqueia
 * tudo) — mesma lógica de lib/use-entitlement.ts (client), para reforçar em
 * rotas de API que não devem confiar apenas na verificação do browser.
 * `servicoSlug` é ignorado; mantido só por compatibilidade de assinatura.
 */
export async function hasEntitlement(userId: string, _servicoSlug?: string): Promise<boolean> {
  const { data } = await sb
    .from("compras")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "concluida")
    .gt("expira_em", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  return !!data;
}
