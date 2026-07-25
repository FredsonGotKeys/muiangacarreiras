export type CvModeloRecomendado =
  | "classico" | "moderno" | "minimalista" | "executivo" | "corporativo"
  | "elegante" | "ats" | "academico" | "premium" | "criativo";

interface RegraRecomendacao {
  modeloId: CvModeloRecomendado;
  motivo: string;
  palavrasChave: string[];
}

// Ordem importa: regras mais específicas primeiro, para não perder para um
// termo genérico mais abaixo na lista (ex.: "director de design" deve cair
// em criativo, não em premium, por isso "design" é testado antes de "director").
const REGRAS: RegraRecomendacao[] = [
  {
    modeloId: "criativo",
    motivo: "áreas criativas beneficiam de um layout com mais destaque visual e apresentação de competências.",
    palavrasChave: ["designer", "design", "criativo", "criativa", "comunicação", "marketing", "publicidade", "moda", "música", "musico", "músico", "artista", "fotografia", "fotógrafo", "ilustrador", "social media", "redes sociais"],
  },
  {
    modeloId: "premium",
    motivo: "cargos de liderança sénior beneficiam de um modelo que transmite autoridade e maturidade profissional.",
    palavrasChave: ["director", "diretor", "diretora", "ceo", "cfo", "coo", "presidente", "administrador executivo", "gestor sénior", "gestora sénior", "chefe executivo"],
  },
  {
    modeloId: "academico",
    motivo: "perfis académicos com historial de formação/publicações ficam mais organizados num modelo compacto e focado em conteúdo.",
    palavrasChave: ["professor", "professora", "docente", "investigador", "investigadora", "académico", "academico", "bolseiro", "bolseira", "pesquisador"],
  },
  {
    modeloId: "executivo",
    motivo: "o sector financeiro e de consultoria valoriza um formato sóbrio que comunica rigor e confiança.",
    palavrasChave: ["financeiro", "finanças", "contabilista", "contabilidade", "auditor", "auditoria", "consultor", "consultora", "banca", "bancário", "investimento"],
  },
  {
    modeloId: "moderno",
    motivo: "perfis de tecnologia e produto destacam-se com um layout moderno e bem hierarquizado.",
    palavrasChave: ["programador", "programadora", "desenvolvedor", "desenvolvedora", "engenheiro de software", "developer", "tecnologia", "informática", "dados", "produto", "ux", "ui"],
  },
  {
    modeloId: "corporativo",
    motivo: "funções de gestão e recursos humanos em grandes empresas beneficiam de um layout organizado por secções.",
    palavrasChave: ["recursos humanos", "gestor de projectos", "gestora de projectos", "operações", "logística", "multinacional"],
  },
  {
    modeloId: "classico",
    motivo: "áreas formais como Direito e Administração Pública esperam um formato tradicional e sóbrio.",
    palavrasChave: ["advogado", "advogada", "jurídico", "juridico", "administração pública", "governo", "funcionário público", "professor primário", "enfermeiro", "enfermeira"],
  },
  {
    modeloId: "ats",
    motivo: "candidaturas a grandes empresas costumam passar por sistemas automáticos de triagem (ATS).",
    palavrasChave: ["assistente administrativo", "assistente administrativa", "call center", "atendimento ao cliente", "recepcionista"],
  },
];

/**
 * Recomenda um modelo de CV a partir do título profissional já escrito pelo
 * utilizador — correspondência de palavras-chave, sem chamada a IA (grátis,
 * instantâneo). Devolve null se não houver nenhuma correspondência clara.
 */
export function recomendarModelo(tituloProfissional: string): { modeloId: CvModeloRecomendado; motivo: string } | null {
  const texto = tituloProfissional.trim().toLowerCase();
  if (!texto) return null;

  for (const regra of REGRAS) {
    if (regra.palavrasChave.some((palavra) => texto.includes(palavra))) {
      return { modeloId: regra.modeloId, motivo: regra.motivo };
    }
  }
  return null;
}
