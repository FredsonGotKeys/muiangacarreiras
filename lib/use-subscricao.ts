"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "./supabase-browser";
import { useAuth } from "./auth-context";

export type EstadoSub = "loading" | "ativa" | "pendente" | "expirada" | "sem_sub";

function calcEstado(row: { status: string; fim: string | null } | null): {
  estado: EstadoSub; diasRestantes: number | null; fimSub: string | null;
} {
  if (!row) return { estado: "sem_sub", diasRestantes: null, fimSub: null };
  if (row.status === "pendente") return { estado: "pendente", diasRestantes: null, fimSub: null };
  if (row.status === "ativa" && row.fim) {
    const dias = Math.ceil((new Date(row.fim).getTime() - Date.now()) / 86400000);
    if (dias > 0) return { estado: "ativa", diasRestantes: dias, fimSub: row.fim };
  }
  return { estado: "expirada", diasRestantes: null, fimSub: null };
}

export function useSubscricao() {
  const { user, loading: authLoading } = useAuth();
  const [estado, setEstado] = useState<EstadoSub>("loading");
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [fimSub, setFimSub] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setEstado("sem_sub"); return; }

    const sb = getSupabaseBrowser();

    // Carga inicial
    sb
      .from("subscricoes")
      .select("status, fim")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        const r = calcEstado(data as { status: string; fim: string | null } | null);
        setEstado(r.estado);
        setDiasRestantes(r.diasRestantes);
        setFimSub(r.fimSub);
      });

    // Realtime — actualizações em tempo real quando o admin aprova/rejeita
    const channel = sb
      .channel(`sub_user_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscricoes",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { status: string; fim: string | null } | null;
          const r = calcEstado(row);
          setEstado(r.estado);
          setDiasRestantes(r.diasRestantes);
          setFimSub(r.fimSub);
        }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [user, authLoading]);

  return { estado, diasRestantes, fimSub };
}
