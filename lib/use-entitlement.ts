"use client";
import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { getCatalogoItem, listPacotesComServico, type CatalogoItem } from "@/lib/catalogo-client";

/**
 * Verifica se o utilizador já tem direito a usar um serviço de IA:
 * - comprou o serviço avulso (compras.status = 'concluida'); ou
 * - comprou um pacote que inclui este serviço.
 */
export function useEntitlement(servicoSlug: string) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [servico, setServico] = useState<CatalogoItem | null>(null);
  const [pacotes, setPacotes] = useState<CatalogoItem[]>([]);

  const verificar = useCallback(async () => {
    setChecking(true);
    const item = await getCatalogoItem("servico", servicoSlug);
    setServico(item);
    if (!item) { setChecking(false); return; }

    const pacotesRelacionados = await listPacotesComServico(item.id);
    setPacotes(pacotesRelacionados);

    if (!user) { setUnlocked(false); setChecking(false); return; }

    const sb = getSupabaseBrowser();
    const idsRelevantes = [item.id, ...pacotesRelacionados.map((p) => p.id)];

    const { data: compra } = await sb
      .from("compras").select("id").eq("status", "concluida").in("item_id", idsRelevantes).limit(1).maybeSingle();

    setUnlocked(!!compra);
    setChecking(false);
  }, [servicoSlug, user]);

  useEffect(() => { verificar(); }, [verificar]);

  return { checking, unlocked, servico, pacotes, refresh: verificar };
}
