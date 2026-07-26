/**
 * Rede de segurança contra um artefacto ocasional dos modelos de IA: inserir
 * uma quebra de linha a meio de uma frase (ex.: "...e\nde Ana Jonas Quibe,
 * natural de..."). Como o preview usa `white-space: pre-wrap`, essa quebra
 * aparece como um corte de parágrafo indevido.
 *
 * Não dá para distinguir isso de forma genérica de uma quebra estrutural
 * legítima (linhas curtas do cabeçalho, Assunto, assinatura) só pelo
 * comprimento ou pontuação — mas uma linha que termina "pendurada" numa
 * preposição/conjunção sem pontuação nunca é uma linha estrutural válida;
 * é sempre uma frase partida a meio. Junta-se à linha seguinte com um espaço.
 */
const CONJUNCOES_PENDENTES = /(?:^|\s)(e|de|do|da|dos|das|em|no|na|nos|nas|para|com|que|ou|a|o|à|ao)$/i;

export function juntarLinhasPartidas(texto: string): string {
  const linhas = texto.split("\n");
  const resultado: string[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linhaActual = linhas[i];
    const proxima = linhas[i + 1];
    if (
      linhaActual.trim() &&
      proxima?.trim() &&
      CONJUNCOES_PENDENTES.test(linhaActual.trimEnd())
    ) {
      linhas[i + 1] = `${linhaActual.replace(/\s+$/, "")} ${proxima.trimStart()}`;
      continue;
    }
    resultado.push(linhaActual);
  }

  return resultado.join("\n");
}
