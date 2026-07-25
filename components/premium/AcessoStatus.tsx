"use client";
import { useState, useEffect, useRef } from "react";
import { Zap, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/use-entitlement";
import AuthModal from "@/components/AuthModal";
import PagamentoAcessoTotal from "@/components/premium/PagamentoAcessoTotal";

/** "3h45" a partir de agora até `expiraEm"; "0h00" se já passou. */
function formatRestante(expiraEm: string): string {
  const ms = new Date(expiraEm).getTime() - Date.now();
  if (ms <= 0) return "0h00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${String(m).padStart(2, "0")}`;
}

const AVISO_EXPIRACAO_MS = 10 * 60000;

/**
 * Indicador global do passe de Acesso Total: mostra a contagem decrescente
 * quando activo, ou um botão para o comprar quando não está. Visível em
 * qualquer página (montado no layout), para o utilizador perceber sempre
 * quanto tempo lhe resta ou quanto custa desbloquear.
 *
 * O pagamento abre como painel embutido (ancorado ao botão), nunca como
 * modal/pop-up — evita a sensação de "pisca-pisca" quando a confirmação
 * demora.
 */
export default function AcessoStatus() {
  const { user } = useAuth();
  const { checking, unlocked, expiraEm, servico, refresh } = useEntitlement();
  const [comprar, setComprar] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [, tick] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!comprar) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setComprar(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [comprar]);

  if (!user || checking) return null;

  if (unlocked && expiraEm) {
    const expirandoEm = new Date(expiraEm).getTime() - Date.now() < AVISO_EXPIRACAO_MS;
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${expirandoEm ? "animate-pulse" : ""}`}
        style={expirandoEm
          ? { background: "rgba(217,119,6,0.12)", color: "#B45309" }
          : { background: "rgba(210,0,1,0.10)", color: "#D20001" }}
        title={expirandoEm ? "O teu acesso total está prestes a expirar" : "O teu acesso total ainda está activo"}
      >
        <Zap className="w-3 h-3" /> {expirandoEm ? "Expira em breve" : "Acesso activo"} · {formatRestante(expiraEm)}
      </span>
    );
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={() => (user ? setComprar((v) => !v) : setShowAuth(true))}
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95"
        style={{ background: "linear-gradient(135deg, #FE0000 0%, #D20001 100%)", color: "#fff" }}
      >
        <Lock className="w-3 h-3" /> Desbloquear tudo — {servico?.preco_mt ?? 59} MT
      </button>

      {comprar && servico && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl z-40 overflow-hidden">
          <PagamentoAcessoTotal
            servico={servico}
            compacto
            onCancel={() => setComprar(false)}
            onSuccess={() => { setComprar(false); refresh(); }}
          />
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}
