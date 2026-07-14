"use client";
import { useState, useEffect, type ReactNode } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/use-entitlement";
import type { TipoCatalogo } from "@/lib/catalogo-client";
import ZumboPayModal from "@/components/ZumboPayModal";
import AuthModal from "@/components/AuthModal";

/**
 * Bloqueia o conteúdo de um serviço de IA até o utilizador ter direito a
 * usá-lo (compra do serviço avulso, ou de um pacote que o inclui). Mostra
 * as opções disponíveis, destacando automaticamente a mais barata.
 */
export default function CompraGate({
  servicoSlug,
  servicoNome,
  children,
  onUnlock,
}: {
  servicoSlug: string;
  servicoNome: string;
  children: ReactNode;
  /** Chamado uma vez quando o utilizador desbloqueia o serviço (compra concluída). */
  onUnlock?: () => void;
}) {
  const { user } = useAuth();
  const { checking, unlocked, servico, pacotes, refresh } = useEntitlement(servicoSlug);
  const [compra, setCompra] = useState<{ tipo: TipoCatalogo; slug: string } | null>(null);
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

  const pacoteBarato = pacotes[0] ?? null; // já vem ordenado por preço ascendente

  type Opcao = { key: "avulso" | "pacote"; preco: number };
  const opcoes: Opcao[] = [
    { key: "avulso", preco: servico.preco_mt },
    ...(pacoteBarato ? [{ key: "pacote" as const, preco: pacoteBarato.preco_mt }] : []),
  ];
  const maisBarato = opcoes.reduce((a, b) => (b.preco < a.preco ? b : a), opcoes[0]).key;

  function abrir(tipo: TipoCatalogo, slug: string) {
    if (!user) { setShowAuth(true); return; }
    setCompra({ tipo, slug });
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#D20001]/30 bg-[#D20001]/5 p-6 text-center">
      <div className="w-11 h-11 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Lock size={18} className="text-[#D20001]" />
      </div>
      <p className="font-bold text-[#2A0001] mb-1">{servicoNome}</p>
      <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">Escolhe como queres desbloquear esta funcionalidade:</p>

      <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        <button
          onClick={() => abrir("servico", servico.slug)}
          className={`relative text-left p-4 rounded-2xl border-2 transition-all bg-white ${maisBarato === "avulso" ? "border-[#D20001]" : "border-gray-100 hover:border-gray-300"}`}
        >
          {maisBarato === "avulso" && <span className="absolute -top-2.5 left-3 badge bg-[#D20001] text-white text-[10px]">Mais barato</span>}
          <p className="text-xs font-semibold text-gray-400 mb-1">Só este serviço</p>
          <p className="text-lg font-black text-[#2A0001]">{servico.preco_mt} MT</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Pagamento único</p>
        </button>

        {pacoteBarato && (
          <button
            onClick={() => abrir("pacote", pacoteBarato.slug)}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all bg-white ${maisBarato === "pacote" ? "border-[#D20001]" : "border-gray-100 hover:border-gray-300"}`}
          >
            {maisBarato === "pacote" && <span className="absolute -top-2.5 left-3 badge bg-[#D20001] text-white text-[10px]">Melhor poupança</span>}
            <p className="text-xs font-semibold text-gray-400 mb-1">{pacoteBarato.nome}</p>
            <p className="text-lg font-black text-[#2A0001]">{pacoteBarato.preco_mt} MT</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Inclui vários serviços</p>
          </button>
        )}
      </div>

      {compra && (
        <ZumboPayModal
          tipo={compra.tipo}
          slug={compra.slug}
          onClose={() => setCompra(null)}
          onSuccess={() => { setCompra(null); refresh(); }}
        />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      )}
    </div>
  );
}
