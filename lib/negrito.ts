/**
 * Convenção leve para marcar negrito real (não decorativo) no texto gerado:
 * o cabeçalho e o nome do requerente/declarante são sempre envolvidos por
 * `**...**` pelo gerador (IA ou template determinístico). Esta é a ÚNICA
 * utilização de "markdown" permitida no texto — tudo o resto continua
 * proibido (ver REGRAS ABSOLUTAS nos geradores).
 *
 * Isto existe para que o negrito sobreviva às três saídas (pré-visualização
 * no ecrã, .docx, impressão/PDF), que partilham o mesmo texto em bruto.
 */
export interface SegmentoTexto {
  texto: string;
  negrito: boolean;
}

export function parseNegrito(texto: string): SegmentoTexto[] {
  const partes = texto.split("**");
  return partes
    .map((texto, i) => ({ texto, negrito: i % 2 === 1 }))
    .filter((s) => s.texto.length > 0);
}

/**
 * Corta uma lista de segmentos já divididos (ver `parseNegrito`) em dois
 * pontos, preservando o negrito de cada metade mesmo que o corte caia a
 * meio de um segmento — usado para a pré-visualização gratuita/bloqueada,
 * que corta o texto num nº fixo de caracteres. Cortar a STRING em bruto
 * nesse ponto poderia partir um par "**...**" ao meio.
 */
export function cortarSegmentos(segmentos: SegmentoTexto[], tamanho: number): [SegmentoTexto[], SegmentoTexto[]] {
  const antes: SegmentoTexto[] = [];
  const depois: SegmentoTexto[] = [];
  let restante = tamanho;
  let ultrapassou = false;

  for (const seg of segmentos) {
    if (ultrapassou) {
      depois.push(seg);
      continue;
    }
    if (seg.texto.length <= restante) {
      antes.push(seg);
      restante -= seg.texto.length;
    } else {
      if (restante > 0) antes.push({ texto: seg.texto.slice(0, restante), negrito: seg.negrito });
      depois.push({ texto: seg.texto.slice(restante), negrito: seg.negrito });
      ultrapassou = true;
    }
  }
  return [antes, depois];
}

/** Extensão plana de um texto marcado (sem os marcadores "**") — usada para "quantos caracteres reais tem isto". */
export function tamanhoSemMarcadores(texto: string): number {
  return parseNegrito(texto).reduce((soma, s) => soma + s.texto.length, 0);
}

/** Remove os marcadores "**", devolvendo o texto plano — para copiar, partilhar por WhatsApp/email, etc. */
export function paraTextoPlano(texto: string): string {
  return parseNegrito(texto).map((s) => s.texto).join("");
}

/** Converte marcadores "**texto**" em `<strong>texto</strong>`, escapando primeiro o resto do HTML — usado na janela de impressão/PDF. */
export function negritoParaHtml(texto: string): string {
  return parseNegrito(texto.replace(/</g, "&lt;"))
    .map((s) => (s.negrito ? `<strong>${s.texto}</strong>` : s.texto))
    .join("");
}
