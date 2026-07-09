"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, Circle, Square, RectangleVertical, AlertTriangle } from "lucide-react";
import { autoCenterSquare, enhanceLighting, makeCircular, makeRectangular } from "@/lib/photo-enhance";

type Versao = "quadrada" | "circular" | "rectangular";

export default function FotoVersoes({
  fotoProcessada,
  qualidadeAviso,
  onSelect,
}: {
  fotoProcessada: string;
  qualidadeAviso: string | null;
  onSelect: (dataUrl: string) => void;
}) {
  const [loading, setLoading] = useState<Versao | null>(null);
  const [versoes, setVersoes] = useState<Record<Versao, string | null>>({ quadrada: null, circular: null, rectangular: null });
  const [selecionada, setSelecionada] = useState<Versao | null>(null);

  async function gerar(tipo: Versao) {
    setLoading(tipo);
    try {
      const enquadrada = await autoCenterSquare(fotoProcessada);
      const melhorada = await enhanceLighting(enquadrada);
      let out = melhorada;
      if (tipo === "circular") out = await makeCircular(melhorada);
      if (tipo === "rectangular") out = await makeRectangular(melhorada);
      setVersoes(v => ({ ...v, [tipo]: out }));
      setSelecionada(tipo);
      onSelect(out);
    } catch {
      // silencioso — mantém foto original se falhar
    } finally {
      setLoading(null);
    }
  }

  const opts: { tipo: Versao; label: string; Icon: React.ElementType }[] = [
    { tipo: "quadrada", label: "Quadrada", Icon: Square },
    { tipo: "circular", label: "Circular", Icon: Circle },
    { tipo: "rectangular", label: "Formal 3:4", Icon: RectangleVertical },
  ];

  return (
    <div className="mt-3">
      {qualidadeAviso && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700">{qualidadeAviso}</p>
        </div>
      )}

      <p className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
        <Wand2 className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} /> Ajuste automático — enquadramento, luz e nitidez
      </p>

      <div className="grid grid-cols-3 gap-2">
        {opts.map(({ tipo, label, Icon }) => (
          <button
            key={tipo}
            onClick={() => gerar(tipo)}
            disabled={loading !== null}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all disabled:opacity-60 ${
              selecionada === tipo ? "border-[#8B5CF6] bg-[#8B5CF6]/5" : "border-gray-100 hover:border-gray-300"
            }`}
          >
            {versoes[tipo] ? (
              <img src={versoes[tipo]!} alt={label} className={`w-12 h-12 object-cover ${tipo === "circular" ? "rounded-full" : "rounded-lg"}`} />
            ) : loading === tipo ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#8B5CF6" }} />
            ) : (
              <Icon className="w-5 h-5 text-gray-300" />
            )}
            <span className="text-[10px] font-semibold text-gray-500">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
