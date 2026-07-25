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
  const row = await entitlementRow(userId);
  return !!row;
}

/**
 * Igual a `hasEntitlement`, mas devolve também `expira_em` — para UI que
 * precisa de mostrar a contagem decrescente sem confiar no relógio do
 * browser (usado por app/api/entitlement/status/route.ts).
 */
export async function entitlementRow(userId: string): Promise<{ expira_em: string } | null> {
  const { data } = await sb
    .from("compras")
    .select("expira_em")
    .eq("user_id", userId)
    .eq("status", "concluida")
    .gt("expira_em", new Date().toISOString())
    .order("expira_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { expira_em: string } | null;
}
