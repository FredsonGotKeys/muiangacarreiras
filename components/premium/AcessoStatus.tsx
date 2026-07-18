"use client";
import { useState, useEffect } from "react";
import { Zap, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/use-entitlement";
import ZumboPayModal from "@/components/ZumboPayModal";
import AuthModal from "@/components/AuthModal";

/** "3h45" a partir de agora até `expiraEm"; "0h00" se já passou. */
function formatRestante(expiraEm: string): string {
  const ms = new Date(expiraEm).getTime() - Date.now();
  if (ms <= 0) return "0h00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Indicador global do passe de Acesso Total: mostra a contagem decrescente
 * quando activo, ou um botão para o comprar quando não está. Visível em
 * qualquer página (montado no layout), para o utilizador perceber sempre
 * quanto tempo lhe resta ou quanto custa desbloquear.
 */
export default function AcessoStatus() {
  const { user } = useAuth();
  const { checking, unlocked, expiraEm, servico, refresh } = useEntitlement();
  const [comprar, setComprar] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!user || checking) return null;

  if (unlocked && expiraEm) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
        style={{ background: "rgba(210,0,1,0.10)", color: "#D20001" }}
        title="O teu acesso total ainda está activo"
      >
        <Zap className="w-3 h-3" /> Acesso activo · {formatRestante(expiraEm)}
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => (user ? setComprar(true) : setShowAuth(true))}
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95"
        style={{ background: "linear-gradient(135deg, #FE0000 0%, #D20001 100%)", color: "#fff" }}
      >
        <Lock className="w-3 h-3" /> Desbloquear tudo — {servico?.preco_mt ?? 59} MT
      </button>
      {comprar && servico && (
        <ZumboPayModal
          tipo="servico"
          slug={servico.slug}
          tituloSucesso="Acesso desbloqueado!"
          subtituloSucesso="Tens acesso total ao site pelas próximas 8 horas."
          onClose={() => setComprar(false)}
          onSuccess={() => { setComprar(false); refresh(); }}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}
