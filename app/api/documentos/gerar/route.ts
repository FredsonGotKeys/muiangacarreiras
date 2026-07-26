import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";
import { getTipoDocumento } from "@/lib/documentos-tipos";
import { juntarLinhasPartidas } from "@/lib/normalizar-texto";

/**
 * Gera qualquer documento do catálogo "diversos" (cartas, requerimentos,
 * declarações) a partir dos dados pessoais (tipo BI moçambicano) + detalhes
 * livres do utilizador. A geração é livre e imediata — a cobrança acontece
 * só ao copiar/descarregar (mesma lógica das restantes ferramentas).
 */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 6))) return rateLimitedResponse();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    const tipoSlug = str(body?.tipo, 80);
    const tipo = tipoSlug ? getTipoDocumento(tipoSlug) : undefined;
    if (!tipo) return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });

    const nome = str(body?.nome, 200) ?? "";
    const sexoRaw = str(body?.sexo, 1) ?? "";
    const sexo = sexoRaw === "M" ? "Masculino" : sexoRaw === "F" ? "Feminino" : "";
    const bi = str(body?.bi, 50) ?? "";
    const biEmitidoEm = str(body?.biEmitidoEm, 100) ?? "";
    const biDataEmissao = str(body?.biDataEmissao, 30) ?? "";
    const dataNascimento = str(body?.dataNascimento, 30) ?? "";
    const naturalidade = str(body?.naturalidade, 100) ?? "";
    const nacionalidade = str(body?.nacionalidade, 60) ?? "";
    const estadoCivil = str(body?.estadoCivil, 50) ?? "";
    const profissao = str(body?.profissao, 100) ?? "";
    const nuit = str(body?.nuit, 30) ?? "";
    const filiacaoPai = str(body?.filiacaoPai, 200) ?? "";
    const filiacaoMae = str(body?.filiacaoMae, 200) ?? "";
    const morada = str(body?.morada, 300) ?? "";
    const contacto = str(body?.contacto, 200) ?? "";
    const entidade = str(body?.entidade, 200) ?? "";
    const segundaPessoaNome = str(body?.segundaPessoaNome, 200) ?? "";
    const segundaPessoaBi = str(body?.segundaPessoaBi, 50) ?? "";
    const segundaPessoaNacionalidade = str(body?.segundaPessoaNacionalidade, 60) ?? "";
    const segundaPessoaProfissao = str(body?.segundaPessoaProfissao, 100) ?? "";
    const segundaPessoaSexoRaw = str(body?.segundaPessoaSexo, 1) ?? "";
    const segundaPessoaSexo = segundaPessoaSexoRaw === "M" ? "Masculino" : segundaPessoaSexoRaw === "F" ? "Feminino" : "";
    const detalhes = str(body?.detalhes, 3000) ?? "";

    if (!nome) return NextResponse.json({ error: "Indica o teu nome completo." }, { status: 400 });
    if (!detalhes) return NextResponse.json({ error: "Descreve os detalhes do pedido." }, { status: 400 });
    if (tipo.precisaEntidade && !entidade) {
      return NextResponse.json({ error: `Indica ${tipo.labelEntidade?.toLowerCase() ?? "a entidade"}.` }, { status: 400 });
    }
    if (tipo.precisaSegundaPessoa && !segundaPessoaNome) {
      return NextResponse.json({ error: "Indica o nome da segunda pessoa envolvida." }, { status: 400 });
    }

    const dadosRequerente = [
      `Nome completo: ${nome}`,
      sexo && `Sexo: ${sexo}`,
      bi && `Bilhete de Identidade nº: ${bi}`,
      (biEmitidoEm || biDataEmissao) && `BI emitido em: ${[biEmitidoEm, biDataEmissao].filter(Boolean).join(", aos ")}`,
      dataNascimento && `Data de nascimento: ${dataNascimento}`,
      naturalidade && `Naturalidade: ${naturalidade}`,
      nacionalidade && `Nacionalidade: ${nacionalidade}`,
      estadoCivil && `Estado civil: ${estadoCivil}`,
      profissao && `Profissão: ${profissao}`,
      (filiacaoPai || filiacaoMae) && `Filiação (nome do pai e da mãe): ${[filiacaoPai, filiacaoMae].filter(Boolean).join(" e ")}`,
      nuit && `NUIT: ${nuit}`,
      morada && `Residência/Morada: ${morada}`,
      contacto && `Contacto: ${contacto}`,
    ].filter(Boolean).join("\n");

    const dadosExtra = [
      tipo.precisaEntidade && entidade && `${tipo.labelEntidade ?? "Entidade"}: ${entidade}`,
      tipo.precisaSegundaPessoa && segundaPessoaNome && `Nome da segunda pessoa: ${segundaPessoaNome}`,
      tipo.precisaSegundaPessoa && segundaPessoaSexo && `Sexo da segunda pessoa: ${segundaPessoaSexo}`,
      tipo.precisaSegundaPessoa && segundaPessoaBi && `BI da segunda pessoa: ${segundaPessoaBi}`,
      tipo.precisaSegundaPessoa && segundaPessoaNacionalidade && `Nacionalidade da segunda pessoa: ${segundaPessoaNacionalidade}`,
      tipo.precisaSegundaPessoa && segundaPessoaProfissao && `Profissão da segunda pessoa: ${segundaPessoaProfissao}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `És um assistente moçambicano especializado em redigir documentos formais (cartas, requerimentos e declarações), cumprindo rigorosamente as regras de elaboração usadas em Moçambique — não é apenas prosa formal genérica, é a estrutura exacta que estas peças exigem.

DOCUMENTO A GERAR: ${tipo.titulo}
${tipo.instrucao}

REGRAS DE ESTRUTURA OBRIGATÓRIAS PARA ESTE TIPO DE DOCUMENTO (cumprir à risca):
${tipo.estrutura}

REGRAS ABSOLUTAS (têm precedência sobre a secção de estrutura acima sempre que houver conflito no negrito ou na ordem do fecho):
- NEGRITO: esta é a ÚNICA utilização permitida de "**...**" — não é markdown decorativo, é a forma de indicar negrito real neste sistema. (1) Cada linha do cabeçalho/destinatário deve ser envolvida INDIVIDUALMENTE em "**...**" — ex.: "**Exmo(a). Senhor(a)**" numa linha, "**Director(a) de Recursos Humanos**" na linha seguinte — nunca um único par "**...**" a abranger várias linhas. (2) O nome completo do requerente/declarante deve estar sempre envolvido em "**...**", tanto na frase de identificação como no fecho.
- ORDEM DO FECHO: o bloco final do documento tem de seguir exactamente esta ordem, cada elemento na sua própria linha, separados por linhas em branco: 1) "[Local], aos [dia] de [mês] de [ano]"; 2) "**[Nome completo do requerente/declarante]**"; 3) uma linha de sublinhado ("_____________________________________") para a assinatura física. Nunca coloques o nome depois da linha de sublinhado — o nome vem sempre antes.
- FORMATAÇÃO DE LINHAS: cada parágrafo de prosa (ex.: a frase de identificação, o corpo, a fundamentação) tem de ser devolvido numa ÚNICA linha contínua, sem nenhuma quebra de linha (\n) no meio da frase, seja qual for o comprimento. Só usa quebra de linha para separar blocos estruturais distintos e completos: uma linha do cabeçalho de outra, "Assunto:" do resto, um parágrafo completo do parágrafo seguinte, e a linha de assinatura. Nunca termines uma linha a meio de uma frase numa preposição ou conjunção (ex.: "...e", "...de", "...a") — isso corta o parágrafo ao meio de forma incorrecta.
- Usa APENAS a informação fornecida pelo utilizador (dados pessoais, entidade, detalhes). Nunca inventes factos, datas, entidades, números de BI ou moradas que não estejam indicados.
- Integra TODOS os dados pessoais fornecidos (nome, BI e respectiva data/local de emissão quando indicados, data de nascimento, naturalidade, nacionalidade, estado civil, profissão, filiação, NUIT quando relevante para o tipo de documento, morada) no parágrafo de identificação do requerente/declarante — não os omitas nem os relegues para o fim. Usa apenas os campos que tiverem sido fornecidos; não incluas um campo que não veio preenchido.
- CONCORDÂNCIA DE GÉNERO: se o campo "Sexo" tiver sido indicado (Masculino/Feminino), escreve SEMPRE a forma correcta da palavra consoante esse género — nunca escrevas a forma dupla com barra ("filho(a)", "nascido(a)", "solteiro(a)", "portador(a)", "casado(a)", "senhor(a)"). Masculino: filho, nascido, solteiro, casado, divorciado, portador, "o requerente"/"o declarante". Feminino: filha, nascida, solteira, casada, divorciada, portadora, "a requerente"/"a declarante". Se o Sexo não tiver sido indicado, usa a forma masculina por defeito (é a convenção neutra em português quando o género é desconhecido) — nunca a forma com barra.
- PROSA CONTÍNUA: a frase de identificação (nome, filiação, naturalidade, nacionalidade, estado civil, profissão, BI, residência) deve ler-se como texto corrido e natural, ligado por vírgulas e conjunções como um funcionário experiente escreveria — nunca como uma lista mecânica de campos separados por vírgula sem ligação. Exemplo do registo certo: "Eu, [nome], filho de [pai] e de [mãe], natural de [naturalidade], de nacionalidade [nacionalidade], [estado civil], [profissão], portador do Bilhete de Identidade n.º [bi], residente em [morada], venho, respeitosamente, requerer a V. Exa. que se digne...".
- TRATAMENTO: usa sempre tratamento protocolar dirigido à entidade/destinatário (ex.: "V. Exa.", "Vossa Excelência"), e varia as fórmulas de abertura do pedido (ex.: "Venho, respeitosamente, requerer...", "Tenho a honra de solicitar...", "Vem por este meio solicitar...") em vez de repetir sempre a mesma frase entre documentos.
- Tom formal, elegante e directo — português de Moçambique/Portugal (nunca brasileiro). Escreve como um técnico administrativo experiente ou advogado, não como um assistente de IA a ser simpático.
- Nunca uses fórmulas genéricas ou traduzidas do inglês que soam a IA, como "Espero que esta mensagem o encontre bem", "É com enorme satisfação/imenso prazer que...", ou qualquer abertura efusiva/emocional fora do tom administrativo. Fórmulas formais moçambicanas tradicionais (ex.: "Venho por este meio...", "Nos termos da legislação vigente...", "Pede deferimento.") são as correctas e devem ser usadas quando apropriado — não são "IA", são o registo correcto.
- Não repitas a mesma frase ou ideia mais que uma vez no documento. Não uses emojis, listas com marcadores, nem qualquer formatação Markdown (**negrito**, #, -, etc.) — o texto é para um documento formal, não para um chat.
- Se faltar alguma informação necessária para completar o documento correctamente, deixa um marcador claro entre parênteses rectos, ex.: [Data de emissão do BI], em vez de inventar.
- Devolve APENAS o texto do documento, sem explicações, sem markdown, sem títulos extra.`;

    const userMsg = `DADOS DO REQUERENTE/DECLARANTE:\n${dadosRequerente}${dadosExtra ? `\n\nDADOS ADICIONAIS:\n${dadosExtra}` : ""}\n\nDETALHES DO PEDIDO:\n${detalhes}`;

    const result = await chatCompletion({
      maxTokens: 800,
      temperature: 0.35,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Erro ao gerar o documento." }, { status: 502 });
    }

    const texto = juntarLinhasPartidas(result.content);
    if (!texto.trim()) return NextResponse.json({ error: "Não foi possível gerar o documento." }, { status: 502 });

    return NextResponse.json({ texto });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
