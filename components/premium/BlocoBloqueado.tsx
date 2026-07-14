"use client";
import { Lock } from "lucide-react";

interface Props {
  unlocked: boolean;
  onDesbloquear: () => void;
  precoMt?: number | string;
  minHeight?: number;
  children: React.ReactNode;
}

/**
 * Esconde visualmente o conteúdo (blur + sem selecção de texto) até o
 * utilizador desbloquear. Impede a cópia casual (Ctrl+C) do resultado
 * gerado por IA sem passar pelo pagamento.
 */
export default function BlocoBloqueado({ unlocked, onDesbloquear, precoMt, minHeight, children }: Props) {
  if (unlocked) return <>{children}</>;

  return (
    <div className="relative" style={minHeight ? { minHeight } : undefined}>
      <div aria-hidden className="select-none pointer-events-none blur-[6px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={onDesbloquear}
          className="btn-vivid text-xs px-4 py-2.5 pointer-events-auto shadow-lg"
        >
          <Lock className="w-3.5 h-3.5" />
          Desbloquear tudo{precoMt !== undefined ? `, ${precoMt} MT` : ""}
        </button>
      </div>
    </div>
  );
}
