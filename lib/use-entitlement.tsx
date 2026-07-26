"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getCatalogoItem, type CatalogoItem } from "@/lib/catalogo-client";

const POLL_MS = 45000;

interface EntitlementState {
  checking: boolean;
  unlocked: boolean;
  expiraEm: string | null;
  servico: CatalogoItem | null;
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementState | null>(null);

/**
 * Fonte única do estado do passe "Acesso Total" para toda a app — monta-se
 * uma vez em app/layout.tsx. Antes, cada componente (CompraGate,
 * AcessoStatus, CvAnaliseIA, CvMatchingVaga, DocumentosGerados, etc.) tinha
 * a sua própria instância de `useEntitlement()`, cada uma a disparar o seu
 * próprio pedido a /api/entitlement/status e o seu próprio temporizador —
 * numa página com várias ferramentas montadas ao mesmo tempo (ex.: o passo
 * de pré-visualização do CV) isso significava pedidos duplicados e, por
 * breves instantes, painéis diferentes podiam mostrar estados diferentes
 * ("desbloqueado" num, "a verificar" noutro) até todos resolverem.
 *
 * A decisão "está desbloqueado?" continua a vir sempre do servidor (nunca
 * do relógio do browser — ver app/api/entitlement/status/route.ts). Três
 * mecanismos mantêm o estado correcto sem a pessoa ter de recarregar:
 * 1. Subscrição Realtime à tabela `compras` do próprio utilizador — assim
 *    que o webhook do ZumboPay confirma o pagamento (ou uma limpeza futura
 *    actualiza a linha), o estado corrige-se de imediato, em todos os
 *    componentes ao mesmo tempo — não depende de clicar em "Continuar" no
 *    modal de pagamento.
 * 2. Temporizador exacto para o instante em que `expira_em` passa — não é
 *    preciso esperar pelo polling para deixar de mostrar "desbloqueado".
 * 3. Polling de 45s como rede de segurança (cobre falhas de rede pontuais
 *    ou perda de ligação Realtime).
 */
export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [servico, setServico] = useState<CatalogoItem | null>(null);

  // Só mostra o estado "a verificar" na primeira verificação de cada
  // utilizador. Sem isto, cada revalidação em segundo plano (polling de
  // 45s, o temporizador de expiração, o Realtime a "compras") também
  // marcava `checking=true` por um instante — fazia o indicador da navbar
  // (e qualquer CompraGate) desaparecer e reaparecer repetidamente,
  // parecendo uma lâmpada com mau contacto, mesmo sem nada de errado.
  const utilizadorVerificado = useRef<string | undefined>(undefined);

  const verificar = useCallback(async () => {
    const primeiraVerificacao = utilizadorVerificado.current !== userId;
    if (primeiraVerificacao) setChecking(true);
    const item = await getCatalogoItem("servico", "acesso-total");
    setServico(item);

    if (!userId) {
      setUnlocked(false);
      setExpiraEm(null);
      setChecking(false);
      utilizadorVerificado.current = userId;
      return;
    }

    try {
      const res = await authFetch("/api/entitlement/status");
      if (!res.ok) { setUnlocked(false); setExpiraEm(null); return; }
      const data = await res.json();
      setUnlocked(!!data.unlocked);
      setExpiraEm(data.expiraEm ?? null);
    } catch {
      setUnlocked(false);
      setExpiraEm(null);
    } finally {
      setChecking(false);
      utilizadorVerificado.current = userId;
    }
  }, [userId]);

  const verificarRef = useRef(verificar);
  verificarRef.current = verificar;

  useEffect(() => { verificar(); }, [verificar]);

  // Polling de segurança
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => verificarRef.current(), POLL_MS);
    return () => clearInterval(id);
  }, [userId]);

  // Corrige o estado exactamente quando o passe expira, sem esperar pelo polling
  useEffect(() => {
    if (!expiraEm) return;
    const ms = new Date(expiraEm).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => verificarRef.current(), ms + 1000);
    return () => clearTimeout(t);
  }, [expiraEm]);

  // Realtime: reage de imediato quando o pagamento é confirmado
  useEffect(() => {
    if (!userId) return;
    const sb = getSupabaseBrowser();
    const channel = sb
      .channel(`compras-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "compras", filter: `user_id=eq.${userId}` },
        () => verificarRef.current(),
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [userId]);

  const value: EntitlementState = { checking, unlocked, expiraEm, servico, refresh: verificar };
  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

/**
 * Acesso é um passe único global — "Acesso Total", 109 MT, desbloqueia tudo
 * no site por 8 horas — em vez de compras por serviço. O parâmetro
 * `servicoSlug` é ignorado; mantido só para não obrigar a reescrever todos
 * os componentes que já chamam `useEntitlement(slug)`.
 */
export function useEntitlement(_servicoSlug?: string) {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    throw new Error("useEntitlement() só pode ser usado dentro de <EntitlementProvider> (montado em app/layout.tsx).");
  }
  return { ...ctx, pacotes: [] as CatalogoItem[] };
}
