/**
 * Catálogo dos documentos "diversos" (cartas, requerimentos, declarações)
 * gerados fora do fluxo de CV. Cada tipo aponta para o slug do serviço em
 * catalogo_itens que desbloqueia a categoria inteira (uma compra dá acesso
 * a gerar/descarregar qualquer documento dessa categoria).
 *
 * `estrutura` codifica as regras formais moçambicanas de cada tipo
 * (cabeçalho/vocativo, corpo, fórmula de fecho) — o gerador (lib IA) deve
 * segui-las à risca, não é apenas um "tom" sugerido.
 */

export type CategoriaDocumento = "emprego" | "requerimentos" | "declaracoes" | "outros";

export interface TipoDocumento {
  slug: string;
  categoria: CategoriaDocumento;
  servicoSlug: string;
  titulo: string;
  /** Frase curta mostrada no card de selecção. */
  descricaoCurta: string;
  /** Instrução específica passada ao MUIANGA IA para gerar este documento. */
  instrucao: string;
  /** Regras obrigatórias de estrutura/formato (cabeçalho, fecho) para este tipo. */
  estrutura: string;
  /** Requerimentos e a Declaração de Trabalho precisam do nome de uma entidade destinatária/emissora. */
  precisaEntidade?: boolean;
  /** Rótulo do campo "entidade", quando aplicável (varia consoante o tipo). */
  labelEntidade?: string;
  /** Documentos que envolvem uma segunda pessoa identificada (união de facto, dependência económica). */
  precisaSegundaPessoa?: boolean;
}

export const CATEGORIAS: { id: CategoriaDocumento; label: string; servicoSlug: string }[] = [
  { id: "emprego", label: "Emprego", servicoSlug: "cartas-emprego-extra" },
  { id: "requerimentos", label: "Requerimentos", servicoSlug: "requerimentos-diversos" },
  { id: "declaracoes", label: "Declarações", servicoSlug: "declaracoes" },
  { id: "outros", label: "Outros", servicoSlug: "requerimentos-diversos" },
];

const FECHO_REQUERIMENTO = `Fecho obrigatório: termina sempre com a fórmula consagrada "Pede deferimento." (em parágrafo isolado), seguida de "[Local], aos [dia] de [mês] de [ano]" e, por fim, "O(A) Requerente,\n_____________________________" (linha para assinatura, com o nome completo por baixo).`;

const FECHO_DECLARACAO = `Fecho obrigatório: termina com "Por ser verdade e me ter sido solicitada, passo a presente declaração que vai por mim assinada." (adaptar o "por mim" se a declaração for emitida por uma entidade, não pela própria pessoa), seguida de "[Local], aos [dia] de [mês] de [ano]" e, por fim, uma linha de assinatura com a designação correcta (ex.: "O(A) Declarante," ou "A Entidade Empregadora," conforme o caso).`;

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  // Emprego
  {
    slug: "carta-pedido-emprego",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Pedido de Emprego",
    descricaoCurta: "Pede formalmente uma vaga a uma empresa concreta",
    instrucao: "Redige uma carta de pedido de emprego, dirigida à entidade/empresa indicada, manifestando o interesse em ser considerado(a) para uma oportunidade de trabalho, com base no perfil e detalhes fornecidos.",
    estrutura: `Cabeçalho: "[Local], aos [dia] de [mês] de [ano]" seguido de "Exmo(a). Senhor(a) Director(a) de Recursos Humanos" (ou o cargo/entidade indicado). Corpo: identifica o requerente pelo nome completo logo na primeira frase, expõe o objectivo e o valor que traz. Fecho: fórmula de cortesia formal ("Com os melhores cumprimentos," / "Na expectativa de uma resposta favorável,"), seguida de "_____________________________" e o nome completo por baixo.`,
    precisaEntidade: true,
    labelEntidade: "Empresa a quem se dirige",
  },
  {
    slug: "carta-candidatura-espontanea",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Candidatura Espontânea",
    descricaoCurta: "Candidata-te sem que a empresa tenha anunciado vaga",
    instrucao: "Redige uma carta de candidatura espontânea — o candidato não está a responder a um anúncio de vaga concreto, mas a demonstrar interesse em integrar a empresa caso surja oportunidade futura.",
    estrutura: `Mesma estrutura formal de uma carta de emprego (cabeçalho com local/data, vocativo dirigido à empresa, corpo, fecho de cortesia com espaço para assinatura), deixando claro logo na abertura que não há vaga anunciada, apenas interesse genuíno em integrar a organização.`,
    precisaEntidade: true,
    labelEntidade: "Empresa a quem se dirige",
  },
  {
    slug: "carta-resposta-vaga",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Resposta a Vaga",
    descricaoCurta: "Responde a um anúncio de emprego específico",
    instrucao: "Redige uma carta de resposta a um anúncio de vaga de emprego já publicado pela empresa, referindo o anúncio e alinhando o perfil do candidato aos requisitos mencionados.",
    estrutura: `Mesma estrutura formal (cabeçalho, vocativo, fecho com assinatura), referindo explicitamente na primeira frase o anúncio/vaga a que responde e a fonte onde foi vista, se indicada nos detalhes.`,
    precisaEntidade: true,
    labelEntidade: "Empresa a quem se dirige",
  },
  {
    slug: "carta-recomendacao",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Recomendação",
    descricaoCurta: "Recomenda alguém para um cargo, bolsa ou instituição",
    instrucao: "Redige uma carta de recomendação, escrita na perspectiva de quem recomenda (ex.: antigo superior, professor), atestando as qualidades e capacidades da pessoa recomendada com base nos detalhes fornecidos.",
    estrutura: `Cabeçalho com local/data. Corpo identifica quem recomenda e a relação com o recomendado (indicados nos detalhes), depois as qualidades e factos concretos. Fecho: disponibilidade para esclarecimentos adicionais, seguido de "_____________________________" e nome/cargo de quem recomenda.`,
  },
  {
    slug: "carta-demissao",
    categoria: "emprego",
    servicoSlug: "cartas-emprego-extra",
    titulo: "Carta de Demissão/Renúncia",
    descricaoCurta: "Comunica formalmente a saída de um emprego",
    instrucao: "Redige uma carta de demissão/renúncia ao cargo actual, dirigida à entidade empregadora indicada, comunicando a decisão de forma directa e profissional, com base no prazo de aviso prévio e data de saída indicados nos detalhes.",
    estrutura: `Cabeçalho: "[Local], aos [dia] de [mês] de [ano]" seguido de "Exmo(a). Senhor(a) Director(a) de Recursos Humanos" (ou o cargo/entidade indicado). Corpo: comunica de forma directa e inequívoca, logo na primeira frase, a decisão de se demitir do cargo que ocupa, indicando o cargo, a data efectiva de saída e o cumprimento do aviso prévio quando aplicável. Tom respeitoso, sem detalhar motivos a não ser que estejam explicitamente nos detalhes fornecidos. Fecho: agradecimento pela oportunidade e disponibilidade para a transição, seguido de "Com os melhores cumprimentos," e "_____________________________" com o nome completo por baixo.`,
    precisaEntidade: true,
    labelEntidade: "Empresa a quem se dirige",
  },

  // Requerimentos
  {
    slug: "pedido-bolsa-estudos",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Bolsa de Estudos",
    descricaoCurta: "Solicita apoio financeiro para estudar",
    instrucao: "Redige um requerimento formal a solicitar a atribuição de uma bolsa de estudos, justificando a necessidade e o mérito com base nos detalhes fornecidos.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Entidade a quem se dirige (ex.: Direcção da instituição, Fundo de Bolsas)",
  },
  {
    slug: "pedido-matricula",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Matrícula",
    descricaoCurta: "Solicita inscrição/matrícula numa instituição de ensino",
    instrucao: "Redige um requerimento a solicitar a matrícula/inscrição numa instituição de ensino, curso ou ano lectivo indicado.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Instituição de ensino a quem se dirige",
  },
  {
    slug: "pedido-declaracao",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Declaração",
    descricaoCurta: "Solicita a emissão de uma declaração a uma entidade",
    instrucao: "Redige um requerimento a solicitar a emissão de uma declaração por parte de uma entidade (empresa, escola, instituição), especificando a finalidade indicada nos detalhes.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Entidade a quem se dirige",
  },
  {
    slug: "pedido-certidao",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Certidão",
    descricaoCurta: "Solicita a emissão de uma certidão oficial",
    instrucao: "Redige um requerimento a solicitar a emissão de uma certidão (ex.: certidão de nascimento, habilitações, residência), indicando a finalidade e a entidade emissora.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Entidade emissora (ex.: Conservatória, Escola, Município)",
  },
  {
    slug: "pedido-transferencia-escolar",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Transferência Escolar",
    descricaoCurta: "Solicita transferência entre escolas ou turmas",
    instrucao: "Redige um requerimento a solicitar a transferência escolar de um estudante entre instituições, cursos ou turmas, com a devida justificação.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Instituição de ensino a quem se dirige",
  },
  {
    slug: "pedido-vaga",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Vaga",
    descricaoCurta: "Solicita a atribuição de uma vaga (escolar, residencial, etc.)",
    instrucao: "Redige um requerimento a solicitar a atribuição de uma vaga (ex.: escolar, residência universitária, creche), justificando a necessidade.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Entidade a quem se dirige",
  },
  {
    slug: "pedido-isencao",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Isenção",
    descricaoCurta: "Solicita isenção de uma taxa, propina ou obrigação",
    instrucao: "Redige um requerimento a solicitar a isenção de uma taxa, propina, emolumento ou outra obrigação, fundamentando o pedido com base na situação e nos detalhes fornecidos.",
    estrutura: `${FECHO_REQUERIMENTO} O corpo deve fundamentar o pedido de isenção citando a situação concreta do requerente (indicada nos detalhes) que justifica a dispensa, sem inventar enquadramentos legais que não tenham sido indicados.`,
    precisaEntidade: true,
    labelEntidade: "Entidade a quem se dirige",
  },
  {
    slug: "pedido-licenca",
    categoria: "requerimentos",
    servicoSlug: "requerimentos-diversos",
    titulo: "Pedido de Licença",
    descricaoCurta: "Solicita uma licença (trabalho, construção, actividade, etc.)",
    instrucao: "Redige um requerimento a solicitar a concessão de uma licença (ex.: licença de trabalho, de construção, para o exercício de uma actividade), especificando o tipo de licença e a finalidade indicados nos detalhes.",
    estrutura: FECHO_REQUERIMENTO,
    precisaEntidade: true,
    labelEntidade: "Entidade licenciadora a quem se dirige",
  },

  // Declarações
  {
    slug: "declaracao-residencia",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Residência",
    descricaoCurta: "Confirma o local onde a pessoa reside",
    instrucao: "Redige uma declaração de residência, confirmando que a pessoa reside na morada indicada, no formato formal usado em Moçambique.",
    estrutura: FECHO_DECLARACAO,
  },
  {
    slug: "declaracao-uniao-facto",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de União de Facto",
    descricaoCurta: "Declara a existência de uma união de facto entre duas pessoas",
    instrucao: "Redige uma declaração de união de facto entre as duas pessoas identificadas (dados completos de ambas fornecidos), indicando o tempo de convivência e a morada comum.",
    estrutura: `${FECHO_DECLARACAO} Identifica AMBOS os declarantes pelo nome completo e número de BI logo na abertura ("Nós, [Nome 1], portador(a) do BI nº [...], e [Nome 2], portador(a) do BI nº [...], declaramos..."). Assinatura final de ambos, lado a lado.`,
    precisaSegundaPessoa: true,
  },
  {
    slug: "declaracao-honra",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Honra",
    descricaoCurta: "Declaração pessoal sob compromisso de honra",
    instrucao: "Redige uma declaração sob compromisso de honra, em que o declarante afirma, sob sua responsabilidade, a veracidade do que é indicado nos detalhes fornecidos.",
    estrutura: `${FECHO_DECLARACAO} Inclui explicitamente a expressão "sob compromisso de honra" no corpo da declaração, e a assunção de responsabilidade civil e criminal pela veracidade do declarado.`,
  },
  {
    slug: "declaracao-trabalho",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Trabalho",
    descricaoCurta: "Confirma o vínculo laboral de um trabalhador",
    instrucao: "Redige uma declaração de trabalho, emitida na perspectiva da ENTIDADE EMPREGADORA (não do trabalhador), confirmando o vínculo laboral, cargo, categoria/regime e tempo de serviço do trabalhador identificado.",
    estrutura: `${FECHO_DECLARACAO} A declaração é redigida na voz da empresa/entidade empregadora indicada, não do trabalhador: abre com "[Nome da entidade empregadora], com sede em [morada/entidade], declara para os devidos efeitos que [nome do trabalhador], portador(a) do Bilhete de Identidade nº [...], exerce funções de [cargo] nesta entidade desde [data], em regime [efectivo/a termo/outro]." Assinatura final: "A Entidade Empregadora," ou "O(A) Director(a) de Recursos Humanos,".`,
    precisaEntidade: true,
    labelEntidade: "Nome da empresa/entidade empregadora",
  },
  {
    slug: "declaracao-rendimentos",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Rendimentos",
    descricaoCurta: "Confirma os rendimentos auferidos por uma pessoa",
    instrucao: "Redige uma declaração de rendimentos, confirmando o valor e a origem dos rendimentos da pessoa, com base nos detalhes fornecidos.",
    estrutura: FECHO_DECLARACAO,
  },
  {
    slug: "declaracao-dependencia-economica",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Dependência Económica",
    descricaoCurta: "Declara que uma pessoa depende economicamente de outra",
    instrucao: "Redige uma declaração de dependência económica, confirmando que uma pessoa depende financeiramente de outra, com base nos dados de ambas fornecidos.",
    estrutura: `${FECHO_DECLARACAO} Identifica claramente quem declara (o dependente económico, com nome e BI) e de quem depende (nome e BI da segunda pessoa), e a relação entre ambos (indicada nos detalhes).`,
    precisaSegundaPessoa: true,
  },
  {
    slug: "declaracao-estudante",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Estudante",
    descricaoCurta: "Confirma que uma pessoa está matriculada como estudante",
    instrucao: "Redige uma declaração de estudante, emitida na perspectiva da INSTITUIÇÃO DE ENSINO (não do próprio estudante), confirmando que o(a) estudante identificado(a) se encontra matriculado(a) no curso e ano/período indicados.",
    estrutura: `${FECHO_DECLARACAO} A declaração é redigida na voz da instituição de ensino indicada, não do estudante: abre com "[Nome da instituição de ensino], declara para os devidos efeitos que [nome do estudante], portador(a) do Bilhete de Identidade nº [...], se encontra matriculado(a) no curso de [curso], [ano/período], nesta instituição." Assinatura final: "A Direcção," ou "O(A) Secretário(a) Académico(a),".`,
    precisaEntidade: true,
    labelEntidade: "Nome da instituição de ensino",
  },
  {
    slug: "declaracao-estagio",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração de Estágio",
    descricaoCurta: "Confirma a realização de um estágio numa empresa/instituição",
    instrucao: "Redige uma declaração de estágio, emitida na perspectiva da EMPRESA/INSTITUIÇÃO (não do estagiário), confirmando que o(a) estagiário(a) identificado(a) realizou ou está a realizar um estágio, indicando período, área e, quando fornecida, avaliação do desempenho.",
    estrutura: `${FECHO_DECLARACAO} A declaração é redigida na voz da empresa/instituição indicada, não do estagiário: abre com "[Nome da empresa/instituição], declara para os devidos efeitos que [nome do estagiário], portador(a) do Bilhete de Identidade nº [...], realizou estágio nesta entidade na área de [área], no período de [data início] a [data fim]." Assinatura final: "A Entidade," ou "O(A) Director(a) de Recursos Humanos,".`,
    precisaEntidade: true,
    labelEntidade: "Nome da empresa/instituição onde decorreu o estágio",
  },
  {
    slug: "declaracao-personalizada",
    categoria: "declaracoes",
    servicoSlug: "declaracoes",
    titulo: "Declaração Personalizada",
    descricaoCurta: "Uma declaração para uma finalidade que não está listada",
    instrucao: "Redige uma declaração formal adaptada exactamente à finalidade descrita nos detalhes fornecidos pelo utilizador, mantendo a estrutura e tom formais habituais em Moçambique.",
    estrutura: FECHO_DECLARACAO,
  },

  // Outros documentos institucionais
  {
    slug: "procuracao",
    categoria: "outros",
    servicoSlug: "requerimentos-diversos",
    titulo: "Procuração",
    descricaoCurta: "Autoriza outra pessoa a agir em teu nome",
    instrucao: "Redige uma procuração em que o(a) outorgante (o requerente) confere a uma segunda pessoa (o(a) procurador(a), identificado(a) nos dados adicionais) poderes para praticar os actos especificados nos detalhes, em seu nome.",
    estrutura: `Título centrado em negrito: "PROCURAÇÃO". Corpo abre identificando o(a) OUTORGANTE pelo nome completo, BI e demais dados fornecidos ("Eu, [nome do outorgante], portador(a) do BI nº [...], (...) pela presente procuração nomeio e constituo meu(minha) bastante procurador(a) [nome do procurador], portador(a) do BI nº [...]"), seguido de "a quem confiro os poderes necessários para, em meu nome, [poderes concedidos, conforme os detalhes fornecidos]." Fecho: "[Local], aos [dia] de [mês] de [ano]", seguido de "O(A) Outorgante,\n_____________________________" com o nome completo por baixo. Nunca inventar o âmbito dos poderes — usar apenas o que constar nos detalhes.`,
    precisaSegundaPessoa: true,
  },
  {
    slug: "oficio",
    categoria: "outros",
    servicoSlug: "requerimentos-diversos",
    titulo: "Ofício",
    descricaoCurta: "Comunicação formal entre instituições ou para uma entidade",
    instrucao: "Redige um ofício — comunicação formal institucional dirigida à entidade indicada, sobre o assunto descrito nos detalhes.",
    estrutura: `Cabeçalho: "[Local], aos [dia] de [mês] de [ano]", seguido de "Ofício n.º ___/[ano]" e o destinatário ("Exmo(a). Senhor(a) [cargo/entidade indicado]"). Depois, "Assunto:" (uma linha, resumindo o tema em poucas palavras). Corpo directo e objectivo, sem rodeios, expondo o assunto tratado. Fecho: "Com os melhores cumprimentos," ou "Atenciosamente,", seguido de "_____________________________" e nome/cargo de quem subscreve.`,
    precisaEntidade: true,
    labelEntidade: "Entidade destinatária",
  },
  {
    slug: "memorando",
    categoria: "outros",
    servicoSlug: "requerimentos-diversos",
    titulo: "Memorando",
    descricaoCurta: "Comunicação interna curta e directa",
    instrucao: "Redige um memorando interno — comunicação curta e directa dentro de uma organização, sobre o assunto descrito nos detalhes.",
    estrutura: `Título centrado em negrito: "MEMORANDO". Bloco de cabeçalho em linhas separadas: "De: [remetente]", "Para: [destinatário/departamento indicado]", "Data: [data]", "Assunto: [resumo curto do tema]". Corpo directo, sem saudação formal nem despedida longa — vai directo ao ponto, em um ou dois parágrafos curtos. Fecho: apenas "_____________________________" com o nome de quem subscreve, sem fórmula de cortesia.`,
    precisaEntidade: true,
    labelEntidade: "Destinatário/departamento",
  },
  {
    slug: "carta-reclamacao",
    categoria: "outros",
    servicoSlug: "requerimentos-diversos",
    titulo: "Carta de Reclamação",
    descricaoCurta: "Apresenta formalmente uma queixa a uma empresa/entidade",
    instrucao: "Redige uma carta de reclamação formal, dirigida à entidade indicada, expondo o problema ou insatisfação descrito nos detalhes e solicitando uma resolução concreta.",
    estrutura: `Cabeçalho: "[Local], aos [dia] de [mês] de [ano]" seguido de "Exmo(a). Senhor(a) [cargo/entidade indicado]". Corpo: identifica o requerente pelo nome completo logo na abertura, expõe os factos de forma objectiva e cronológica (datas, referências, o que aconteceu — apenas o que constar nos detalhes), e termina com um pedido claro e concreto de resolução (reembolso, substituição, resposta, correcção, conforme indicado). Tom firme mas respeitoso, nunca agressivo. Fecho: "Na expectativa de uma resposta e resolução em tempo útil," seguido de "_____________________________" e nome completo por baixo.`,
    precisaEntidade: true,
    labelEntidade: "Empresa/entidade a quem se dirige",
  },
];

export function getTipoDocumento(slug: string): TipoDocumento | undefined {
  return TIPOS_DOCUMENTO.find((t) => t.slug === slug);
}
