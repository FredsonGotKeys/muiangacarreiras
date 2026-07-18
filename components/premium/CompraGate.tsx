"use client";
import { useState, useEffect, type ReactNode } from "react";
import { Lock, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/use-entitlement";
import ZumboPayModal from "@/components/ZumboPayModal";
import AuthModal from "@/components/AuthModal";

/**
 * Bloqueia o conteúdo até o utilizador ter um passe de Acesso Total activo
 * (59 MT, desbloqueia tudo no site por 8 horas — não há mais compras por
 * serviço individual).
 */
export default function CompraGate({
  servicoNome,
  children,
  onUnlock,
}: {
  /** Mantido por compatibilidade com chamadores existentes; ignorado. */
  servicoSlug?: string;
  servicoNome: string;
  children: ReactNode;
  /** Chamado uma vez quando o utilizador desbloqueia o acesso (compra concluída). */
  onUnlock?: () => void;
}) {
  const { user } = useAuth();
  const { checking, unlocked, servico, refresh } = useEntitlement();
  const [comprar, setComprar] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [avisado, setAvisado] = useState(false);

  useEffect(() => {
    if (unlocked && !avisado) { setAvisado(true); onUnlock?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  if (checking) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;
  if (!servico) return null; // catálogo indisponível — não bloquear a página com erro

  function abrir() {
    if (!user) { setShowAuth(true); return; }
    setComprar(true);
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#D20001]/30 bg-[#D20001]/5 p-6 text-center">
      <div className="w-11 h-11 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Lock size={18} className="text-[#D20001]" />
      </div>
      <p className="font-bold text-[#2A0001] mb-1">{servicoNome}</p>
      <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">Um único pagamento desbloqueia tudo no site — todas as ferramentas, todos os documentos — durante 8 horas.</p>

      <button
        onClick={abrir}
        className="w-full max-w-xs mx-auto flex flex-col items-center gap-1 p-4 rounded-2xl border-2 border-[#D20001] bg-white transition-all hover:shadow-md active:scale-[0.98]"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#D20001] uppercase tracking-wide">
          <Zap className="w-3 h-3" /> Acesso Total
        </span>
        <span className="text-2xl font-black text-[#2A0001]">{servico.preco_mt} MT</span>
        <span className="text-[11px] text-gray-400">Válido por 8 horas, tudo incluído</span>
      </button>

      {comprar && (
        <ZumboPayModal
          tipo="servico"
          slug={servico.slug}
          tituloSucesso="Acesso desbloqueado!"
          subtituloSucesso="Tens acesso total ao site pelas próximas 8 horas."
          onClose={() => setComprar(false)}
          onSuccess={() => { setComprar(false); refresh(); }}
        />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      )}
    </div>
  );
}
