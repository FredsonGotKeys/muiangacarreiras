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

type Variante = "compacto" | "destaque";

/**
 * Ponto de entrada para comprar o passe de Acesso Total, e indicador do
 * tempo que resta quando já está activo.
 *
 * Duas correcções de visibilidade que faziam as pessoas não encontrarem
 * como pagar:
 *
 * 1. Antes havia `if (!user) return null`, ou seja, quem ainda não tinha
 *    sessão iniciada — precisamente o visitante que chega pela primeira
 *    vez — não via botão nenhum, em lado nenhum do site. Agora vê: ao
 *    clicar, inicia sessão e o painel de pagamento abre logo a seguir,
 *    sem ter de procurar outra vez.
 * 2. No telemóvel só existia dentro do menu hambúrguer. Passa a ficar
 *    visível na barra de topo, com rótulo mais curto para caber.
 *
 * A variante "destaque" é para o hero: maior e com o preço em evidência.
 * Nessa variante o painel de pagamento abre em fluxo (empurra o
 * conteúdo) em vez de flutuar, porque a secção do hero tem
 * `overflow-hidden` e cortaria um painel posicionado de forma absoluta.
 */
export default function AcessoStatus({ variante = "compacto" }: { variante?: Variante }) {
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

  // Fechar ao clicar fora só faz sentido no painel flutuante da barra.
  useEffect(() => {
    if (!comprar || variante === "destaque") return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setComprar(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [comprar, variante]);

  // Enquanto não se sabe o estado, não mostrar nada — evita anunciar
  // "desbloquear" a quem já pagou, por uma fracção de segundo.
  if (checking) return null;

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

  const preco = servico?.preco_mt ?? 109;

  /** Sem sessão: entra primeiro, e o pagamento abre a seguir sozinho. */
  function aoClicar() {
    if (!user) { setShowAuth(true); return; }
    setComprar((v) => !v);
  }

  const painel = comprar && servico && (
    <PagamentoAcessoTotal
      servico={servico}
      compacto
      onCancel={() => setComprar(false)}
      onSuccess={() => { setComprar(false); refresh(); }}
    />
  );

  if (variante === "destaque") {
    return (
      <div ref={wrapRef} className="w-full max-w-sm">
        <button
          onClick={aoClicar}
          className="w-full inline-flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: "rgba(254,0,0,0.10)",
            border: "1px solid rgba(254,0,0,0.35)",
            color: "#fff",
          }}
        >
          <span className="inline-flex items-center gap-2">
            <Lock className="w-4 h-4" style={{ color: "#FE0000" }} />
            Desbloquear tudo por 8 horas
          </span>
          <span className="text-base font-black shrink-0" style={{ color: "#FE0000" }}>{preco} MT</span>
        </button>

        {painel && (
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
            {painel}
          </div>
        )}

        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={() => { setShowAuth(false); setComprar(true); }}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={aoClicar}
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 whitespace-nowrap"
        style={{ background: "linear-gradient(135deg, #FE0000 0%, #D20001 100%)", color: "#fff" }}
      >
        <Lock className="w-3 h-3 shrink-0" />
        {/* Rótulo curto no telemóvel, onde a barra tem pouco espaço. */}
        <span className="hidden sm:inline">Desbloquear tudo — {preco} MT</span>
        <span className="sm:hidden">{preco} MT</span>
      </button>

      {painel && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl z-40 overflow-hidden">
          {painel}
        </div>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => { setShowAuth(false); setComprar(true); }}
        />
      )}
    </div>
  );
}
