import type { SegmentoTexto } from "@/lib/negrito";

/** Renderiza segmentos já divididos por `parseNegrito`/`cortarSegmentos`, aplicando negrito real (não asteriscos literais). */
export default function TextoFormatado({ segmentos }: { segmentos: SegmentoTexto[] }) {
  return (
    <>
      {segmentos.map((seg, i) => (seg.negrito ? <strong key={i}>{seg.texto}</strong> : <span key={i}>{seg.texto}</span>))}
    </>
  );
}
