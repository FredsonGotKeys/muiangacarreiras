"use client";
import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { getCatalogoItem, type CatalogoItem } from "@/lib/catalogo-client";

/**
 * Acesso é agora um passe único global — "Acesso Total", 59 MT, desbloqueia
 * tudo no site por 8 horas — em vez de compras por serviço. O parâmetro
 * `servicoSlug` é ignorado; mantido só para não obrigar a reescrever todos
 * os componentes que já chamam `useEntitlement(slug)`.
 */
export function useEntitlement(_servicoSlug?: string) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [servico, setServico] = useState<CatalogoItem | null>(null);

  const verificar = useCallback(async () => {
    setChecking(true);
    const item = await getCatalogoItem("servico", "acesso-total");
    setServico(item);

    if (!user) { setUnlocked(false); setExpiraEm(null); setChecking(false); return; }

    const sb = getSupabaseBrowser();
    const { data } = await sb
      .from("compras")
      .select("expira_em")
      .eq("user_id", user.id)
      .eq("status", "concluida")
      .gt("expira_em", new Date().toISOString())
      .order("expira_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = data as { expira_em: string } | null;
    setUnlocked(!!row);
    setExpiraEm(row?.expira_em ?? null);
    setChecking(false);
  }, [user]);

  useEffect(() => { verificar(); }, [verificar]);

  return { checking, unlocked, servico, pacotes: [] as CatalogoItem[], expiraEm, refresh: verificar };
}
