/**
 * Catálogo dos documentos "diversos" (cartas, requerimentos, declarações)
 * gerados fora do fluxo de CV. Cada tipo aponta para o slug do serviço em
 * catalogo_itens que desbloqueia a categoria inteira (uma compra dá acesso
 * a gerar/descarregar qualquer documento dessa categoria).
 */

export type CategoriaDocumento = "emprego" | "requerimentos" | "declaracoes";

export interface TipoDocumento {
  slug: string;
  categoria: CategoriaDocumento;
  servicoSlug: string;
  titulo: string;
  /** Frase curta mostrada no card de selecção. */
  descricaoCurta: string;
  /** Instrução específica passada ao MUIANGA IA para gerar este documento. */
  instrucao: string;
}

export const CATEGORIAS: { id: CategoriaDocumento; label: string; servicoSlug: string }[] = [
  { id: "emprego", label: "Emprego", servicoSlug: "cartas-emprego-extra" },
  { id: "requerimentos", label: "Requerimentos", servicoSlug: "requerimentos-diversos" },
  { id: "declaracoes", label: "Declarações", servicoSlug: "declaracoes" },
];

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  // Emprego
  {
    slug: "carta-pedido-emprego",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Pedido de Emprego",
    descricaoCurta: "Pede formalmente uma vaga a uma empresa concreta",
    instrucao: "Redige uma carta de pedido de emprego, dirigida à entidade/empresa indicada, manifestando o interesse em ser considerado(a) para uma oportunidade de trabalho, com base no perfil e detalhes fornecidos.",
  },
  {
    slug: "carta-candidatura-espontanea",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Candidatura Espontânea",
    descricaoCurta: "Candidata-te sem que a empresa tenha anunciado vaga",
    instrucao: "Redige uma carta de candidatura espontânea — o candidato não está a responder a um anúncio de vaga concreto, mas a demonstrar interesse em integrar a empresa caso surja oportunidade futura.",
  },
  {
    slug: "carta-resposta-vaga",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Resposta a Vaga",
    descricaoCurta: "Responde a um anúncio de emprego específico",
    instrucao: "Redige uma carta de resposta a um anúncio de vaga de emprego já publicado pela empresa, referindo o anúncio e alinhando o perfil do candidato aos requisitos mencionados.",
  },
  {
    slug: "carta-recomendacao",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Recomendação",
    descricaoCurta: "Recomenda alguém para um cargo, bolsa ou instituição",
    instrucao: "Redige uma carta de recomendação, escrita na perspectiva de quem recomenda (ex.: antigo superior, professor), atestando as qualidades e capacidades da pessoa recomendada com base nos detalhes fornecidos.",
  },

  // Requerimentos
  {
    slug: "pedido-bolsa-estudos",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Bolsa de Estudos",
    descricaoCurta: "Solicita apoio financeiro para estudar",
    instrucao: "Redige um requerimento formal a solicitar a atribuição de uma bolsa de estudos, justificando a necessidade e o mérito com base nos detalhes fornecidos.",
  },
  {
    slug: "pedido-matricula",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Matrícula",
    descricaoCurta: "Solicita inscrição/matrícula numa instituição de ensino",
    instrucao: "Redige um requerimento a solicitar a matrícula/inscrição numa instituição de ensino, curso ou ano lectivo indicado.",
  },
  {
    slug: "pedido-declaracao",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Declaração",
    descricaoCurta: "Solicita a emissão de uma declaração a uma entidade",
    instrucao: "Redige um requerimento a solicitar a emissão de uma declaração por parte de uma entidade (empresa, escola, instituição), especificando a finalidade indicada nos detalhes.",
  },
  {
    slug: "pedido-certidao",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Certidão",
    descricaoCurta: "Solicita a emissão de uma certidão oficial",
    instrucao: "Redige um requerimento a solicitar a emissão de uma certidão (ex.: certidão de nascimento, habilitações, residência), indicando a finalidade e a entidade emissora.",
  },
  {
    slug: "pedido-transferencia-escolar",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Transferência Escolar",
    descricaoCurta: "Solicita transferência entre escolas ou turmas",
    instrucao: "Redige um requerimento a solicitar a transferência escolar de um estudante entre instituições, cursos ou turmas, com a devida justificação.",
  },
  {
    slug: "pedido-vaga",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Vaga",
    descricaoCurta: "Solicita a atribuição de uma vaga (escolar, residencial, etc.)",
    instrucao: "Redige um requerimento a solicitar a atribuição de uma vaga (ex.: escolar, residência universitária, creche), justificando a necessidade.",
  },

  // Declarações
  {
    slug: "declaracao-residencia",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Residência",
    descricaoCurta: "Confirma o local onde a pessoa reside",
    instrucao: "Redige uma declaração de residência, confirmando que a pessoa reside na morada indicada, no formato formal usado em Moçambique.",
  },
  {
    slug: "declaracao-uniao-facto",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de União de Facto",
    descricaoCurta: "Declara a existência de uma união de facto entre duas pessoas",
    instrucao: "Redige uma declaração de união de facto entre duas pessoas, com base nos detalhes fornecidos (nomes, tempo de convivência, morada comum).",
  },
  {
    slug: "declaracao-honra",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Honra",
    descricaoCurta: "Declaração pessoal sob compromisso de honra",
    instrucao: "Redige uma declaração sob compromisso de honra, em que o declarante afirma, sob sua responsabilidade, a veracidade do que é indicado nos detalhes fornecidos.",
  },
  {
    slug: "declaracao-trabalho",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Trabalho",
    descricaoCurta: "Confirma o vínculo laboral de um trabalhador",
    instrucao: "Redige uma declaração de trabalho (emitida pela entidade empregadora) confirmando o vínculo laboral, cargo e tempo de serviço do trabalhador, com base nos detalhes fornecidos.",
  },
  {
    slug: "declaracao-rendimentos",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Rendimentos",
    descricaoCurta: "Confirma os rendimentos auferidos por uma pessoa",
    instrucao: "Redige uma declaração de rendimentos, confirmando o valor e a origem dos rendimentos da pessoa, com base nos detalhes fornecidos.",
  },
  {
    slug: "declaracao-dependencia-economica",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Dependência Económica",
    descricaoCurta: "Declara que uma pessoa depende economicamente de outra",
    instrucao: "Redige uma declaração de dependência económica, confirmando que uma pessoa depende financeiramente de outra, com base nos detalhes fornecidos.",
  },
  {
    slug: "declaracao-personalizada",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração Personalizada",
    descricaoCurta: "Uma declaração para uma finalidade que não está listada",
    instrucao: "Redige uma declaração formal adaptada exactamente à finalidade descrita nos detalhes fornecidos pelo utilizador, mantendo a estrutura e tom formais habituais em Moçambique.",
  },
];

export function getTipoDocumento(slug: string): TipoDocumento | undefined {
  return TIPOS_DOCUMENTO.find((t) => t.slug === slug);
}
