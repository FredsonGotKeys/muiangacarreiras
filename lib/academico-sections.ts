/**
 * Estrutura modular do Assistente Académico IA.
 * Nada é obrigatório excepto o Tema — o utilizador escolhe exactamente
 * que secções incluir. As predefinições variam por nível académico,
 * mas são apenas um ponto de partida editável.
 */

export type NivelAcademico =
  | "secundario" | "tecnico" | "licenciatura" | "pos-graduacao" | "mestrado" | "doutoramento";

export const NIVEIS: { id: NivelAcademico; label: string }[] = [
  { id: "secundario",     label: "Ensino Secundário" },
  { id: "tecnico",        label: "Ensino Técnico Profissional" },
  { id: "licenciatura",   label: "Licenciatura" },
  { id: "pos-graduacao",  label: "Pós-graduação" },
  { id: "mestrado",       label: "Mestrado" },
  { id: "doutoramento",   label: "Doutoramento" },
];

export type SecaoId =
  | "dedicatoria" | "agradecimentos" | "resumo" | "abstract"
  | "listaFiguras" | "listaTabelas" | "listaAbreviaturas"
  | "introducao" | "objectivoGeral" | "objectivosEspecificos"
  | "problemaInvestigacao" | "hipoteses" | "justificativa"
  | "fundamentacaoTeorica" | "revisaoLiteratura" | "metodologia"
  | "desenvolvimento" | "discussao" | "conclusao" | "recomendacoes"
  | "referencias" | "anexos";

export interface SecaoDef {
  id: SecaoId;
  label: string;
  grupo: "preliminar" | "corpo" | "final";
  /** Secções cujo conteúdo é gerado pela IA (as restantes são apenas estruturais/placeholder) */
  geradaPorIA: boolean;
}

export const SECOES: SecaoDef[] = [
  { id: "dedicatoria",           label: "Dedicatória",                          grupo: "preliminar", geradaPorIA: false },
  { id: "agradecimentos",        label: "Agradecimentos",                       grupo: "preliminar", geradaPorIA: false },
  { id: "resumo",                label: "Resumo",                               grupo: "preliminar", geradaPorIA: true },
  { id: "abstract",              label: "Abstract (inglês)",                    grupo: "preliminar", geradaPorIA: true },
  { id: "listaFiguras",          label: "Lista de Figuras",                     grupo: "preliminar", geradaPorIA: false },
  { id: "listaTabelas",          label: "Lista de Tabelas",                     grupo: "preliminar", geradaPorIA: false },
  { id: "listaAbreviaturas",     label: "Lista de Abreviaturas",                grupo: "preliminar", geradaPorIA: false },
  { id: "introducao",            label: "Introdução",                          grupo: "corpo", geradaPorIA: true },
  { id: "objectivoGeral",        label: "Objectivo Geral",                      grupo: "corpo", geradaPorIA: true },
  { id: "objectivosEspecificos", label: "Objectivos Específicos",               grupo: "corpo", geradaPorIA: true },
  { id: "problemaInvestigacao",  label: "Problema de Investigação",             grupo: "corpo", geradaPorIA: true },
  { id: "hipoteses",             label: "Hipóteses",                            grupo: "corpo", geradaPorIA: true },
  { id: "justificativa",         label: "Justificativa",                        grupo: "corpo", geradaPorIA: true },
  { id: "fundamentacaoTeorica",  label: "Fundamentação Teórica",                grupo: "corpo", geradaPorIA: true },
  { id: "revisaoLiteratura",     label: "Revisão da Literatura",                grupo: "corpo", geradaPorIA: true },
  { id: "metodologia",           label: "Metodologia",                          grupo: "corpo", geradaPorIA: true },
  { id: "desenvolvimento",       label: "Desenvolvimento",                      grupo: "corpo", geradaPorIA: true },
  { id: "discussao",             label: "Discussão",                            grupo: "corpo", geradaPorIA: true },
  { id: "conclusao",             label: "Conclusão",                            grupo: "corpo", geradaPorIA: true },
  { id: "recomendacoes",         label: "Recomendações",                        grupo: "corpo", geradaPorIA: true },
  { id: "referencias",           label: "Referências",                          grupo: "final", geradaPorIA: false },
  { id: "anexos",                label: "Anexos",                               grupo: "final", geradaPorIA: false },
];

/** Predefinições por nível — apenas um ponto de partida, o utilizador pode alterar livremente. */
export function defaultSecoesForNivel(nivel: NivelAcademico): Set<SecaoId> {
  const base: SecaoId[] = ["introducao", "desenvolvimento", "conclusao", "referencias"];

  if (nivel === "secundario" || nivel === "tecnico") {
    return new Set(base);
  }

  const superior: SecaoId[] = [
    "resumo", "introducao", "objectivoGeral", "objectivosEspecificos",
    "justificativa", "fundamentacaoTeorica", "metodologia",
    "desenvolvimento", "conclusao", "recomendacoes", "referencias", "anexos",
  ];

  if (nivel === "licenciatura" || nivel === "pos-graduacao") {
    return new Set(superior);
  }

  // Mestrado / Doutoramento — estrutura mais robusta e rigorosa
  const avancado: SecaoId[] = [
    ...superior,
    "dedicatoria", "agradecimentos", "abstract",
    "listaFiguras", "listaTabelas", "listaAbreviaturas",
    "problemaInvestigacao", "hipoteses", "revisaoLiteratura", "discussao",
  ];
  return new Set(avancado);
}

export const IDIOMAS = [{ id: "pt-pt", label: "Português (Portugal)" }] as const;
