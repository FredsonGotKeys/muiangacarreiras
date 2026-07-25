/**
 * Marca de água sobre conteúdo mostrado de graça (antes de pagar o
 * Acesso Total). Não impede a leitura — só desencoraja imprimir/copiar
 * como se fosse a versão paga. Fica sempre dentro do elemento que a usa
 * (que deve ter `position: relative`), para sobreviver ao CSS de
 * impressão do CV (que só torna visível o que está dentro de
 * `.cv-preview`).
 */
export default function MarcaDagua({ texto = "CÓPIA · MUIANGA" }: { texto?: string }) {
  const linhas = 7;
  const colunas = 3;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          display: "grid",
          gridTemplateColumns: `repeat(${colunas}, 1fr)`,
          gridTemplateRows: `repeat(${linhas}, 1fr)`,
          transform: "rotate(-28deg)",
        }}
      >
        {Array.from({ length: linhas * colunas }).map((_, i) => (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13pt",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(210,0,1,0.14)",
              whiteSpace: "nowrap",
            }}
          >
            {texto}
          </span>
        ))}
      </div>
    </div>
  );
}
