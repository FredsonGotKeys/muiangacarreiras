import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";
import { juntarLinhasPartidas } from "@/lib/normalizar-texto";

/**
 * Gera Carta de Apresentação personalizada a partir dos dados do CV.
 * Se `vaga` (empresa/cargo) não for fornecida, gera carta genérica de alta qualidade.
 * Nunca inventa experiência/competências fora do que já está no CV.
 */
function buildCandidatoSummary(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Nome: ${data.nome || "(não preenchido)"}`);
  lines.push(`Sexo/Género: ${data.genero || "(não indicado)"}`);
  lines.push(`Data de nascimento: ${data.dataNascimento || "(não preenchida)"}`);
  lines.push(`BI/DIRE: ${data.biDire || "(não preenchido)"}`);
  lines.push(`Nacionalidade: ${data.nacionalidade || "Moçambicana"}`);
  lines.push(`Estado civil: ${data.estadoCivil || "(não preenchido)"}`);
  lines.push(`Endereço: ${data.endereco || "(não preenchido)"}${data.cidade ? `, ${data.cidade}` : ""}`);
  lines.push(`Telefone: ${data.telefone || "(não preenchido)"}`);
  lines.push(`Email: ${data.email || "(não preenchido)"}`);
  lines.push(`Título profissional: ${data.titulo || "(não preenchido)"}`);
  lines.push(`Objectivo: ${data.objectivo || "(não preenchido)"}`);

  const experiencia = Array.isArray(data.experiencia) ? data.experiencia : [];
  if (experiencia.length) {
    lines.push(`\nExperiência mais recente:`);
    const e = experiencia[0] as Record<string, unknown>;
    lines.push(`  ${e.cargo ?? "?"} em ${e.empresa ?? "?"}`);
    if (e.descricao) lines.push(`  ${e.descricao}`);
  }

  const formacao = Array.isArray(data.formacao) ? data.formacao : [];
  if (formacao.length) {
    const f = formacao[0] as Record<string, unknown>;
    lines.push(`\nFormação: ${f.grau ?? ""} em ${f.curso ?? "?"} — ${f.instituicao ?? "?"}`);
  }

  const tecnicas = Array.isArray(data.competenciasTecnicas) ? data.competenciasTecnicas : [];
  if (tecnicas.length) lines.push(`\nCompetências: ${tecnicas.join(", ")}`);

  const linguas = Array.isArray(data.linguas) ? data.linguas : [];
  if (linguas.length) {
    lines.push(`Idiomas: ${linguas.map((l: Record<string, unknown>) => `${l.lingua} (${l.nivel})`).join(", ")}`);
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 6))) return rateLimitedResponse();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body?.cvData || typeof body.cvData !== "object") {
      return NextResponse.json({ error: "Dados do CV em falta." }, { status: 400 });
    }

    const empresa = str(body.empresa, 200);
    const cargo = str(body.cargo, 200);
    // Cap defensivo — body.cvData não tem limite de tamanho nos campos individuais
    // (só validados no cliente); sem isto um payload gigante custaria tokens Groq sem limite.
    const resumo = buildCandidatoSummary(body.cvData).slice(0, 6000);

    const contexto = empresa || cargo
      ? `A carta é para a candidatura ao cargo de "${cargo ?? "(não especificado)"}" na empresa "${empresa ?? "(não especificada)"}".`
      : `Não foi especificada empresa nem cargo — gera uma carta genérica de alta qualidade, adaptável a várias candidaturas.`;

    const systemPrompt = `És um consultor de carreira moçambicano especializado em redigir cartas de apresentação profissionais.

REGRAS ABSOLUTAS (têm precedência sobre a estrutura abaixo sempre que houver conflito no negrito ou na ordem do fecho):
- NEGRITO: esta é a ÚNICA utilização permitida de "**...**" — não é markdown decorativo, é negrito real. (1) Cada linha do cabeçalho deve ser envolvida INDIVIDUALMENTE em "**...**" (ex.: "**Exmo(a). Senhor(a)**" numa linha, "**Director(a) de Recursos Humanos**" na linha seguinte) — nunca um único par a abranger várias linhas. (2) O nome completo do candidato deve estar sempre envolvido em "**...**", tanto na frase de abertura como no fecho.
- ORDEM DO FECHO: depois da despedida formal, o bloco final tem de seguir exactamente esta ordem, cada elemento na sua própria linha, separados por linhas em branco: 1) "[Local], aos [dia] de [mês] de [ano]" (usa a cidade do candidato se souberes, senão "___________________________"); 2) "**[Nome completo do candidato]**"; 3) uma linha de sublinhado ("_____________________________________") para a assinatura física. Nunca coloques o nome depois da linha de sublinhado.
- FORMATAÇÃO DE LINHAS: cada parágrafo de prosa tem de ser devolvido numa ÚNICA linha contínua, sem nenhuma quebra de linha (\n) no meio da frase, seja qual for o comprimento. Só usa quebra de linha para separar blocos estruturais distintos: cabeçalho, "Assunto:", um parágrafo completo do seguinte, e o bloco final. Nunca termines uma linha a meio de uma frase numa preposição ou conjunção (ex.: "...e", "...de", "...a").
- Usa APENAS a informação fornecida sobre o candidato. Nunca inventes experiência, formação ou competências.
- Tom profissional, formal, elegante e natural — adequado ao mercado de trabalho moçambicano. Escreve como um consultor de carreira experiente, não como um assistente de IA a ser simpático.
- Estrutura obrigatória, exactamente por esta ordem:
  1. Cabeçalho: "Exmo(a). Senhor(a)" seguido de "Director(a) de Recursos Humanos" e o nome da empresa (ou "___________________________" se não for fornecida), cada um numa linha. (Aqui "(a)" é aceitável — é o destinatário, cujo género é desconhecido.)
  2. Uma linha em branco, depois "Assunto: Candidatura ao cargo de [cargo]" (ou "Assunto: Candidatura Espontânea" se o cargo não for especificado).
  3. Uma linha em branco, depois o parágrafo de abertura DEVE começar literalmente por "Eu, [Nome completo]" seguido, quando os dados existirem, de ", [nascido/nascida] aos [data de nascimento]", ", [portador/portadora] do Bilhete de Identidade/DIRE n.º [BI/DIRE]", ", de nacionalidade [nacionalidade]" e ", residente em [endereço/cidade]" — escrito como texto corrido e natural (nunca uma lista mecânica de campos), omitindo qualquer segmento cujo dado não tenha sido fornecido, sem inventar nem usar reticências. A frase termina por manifestar o interesse na vaga/empresa.
  4. Parágrafo central: experiência e valor que traz.
  5. Parágrafo de fecho: disponibilidade, forma de contacto (telefone/email se fornecidos), agradecimento.
  6. Despedida formal (ex: "Com os melhores cumprimentos,"), seguida do bloco final descrito em ORDEM DO FECHO acima.
- CONCORDÂNCIA DE GÉNERO: usa o campo "Sexo/Género" do candidato para escolher a forma certa das palavras que o descrevem (nascido/nascida, portador/portadora, "o candidato"/"a candidata") — nunca escrevas a forma dupla com barra "(a)" para descrever o PRÓPRIO candidato. Se o género não tiver sido indicado, usa a forma masculina por defeito, nunca a forma com barra.
- Nunca uses fórmulas traduzidas do inglês ou efusivas que soam a IA (ex.: "Espero que esta mensagem o encontre bem", "É com enorme satisfação/imenso prazer que..."). Fórmulas formais moçambicanas (ex.: "Venho por este meio...", "Tenho a honra de...") são as correctas.
- Português de Moçambique/Portugal (não brasileiro).
- Máximo 380 palavras.
- Devolve APENAS o texto da carta, sem explicações, sem markdown, sem títulos adicionais.`;

    const userMsg = `${contexto}\n\nDados do candidato:\n${resumo}`;

    const result = await chatCompletion({
      maxTokens: 700,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Erro ao gerar carta." }, { status: 502 });
    }

    const carta = juntarLinhasPartidas(result.content);
    if (!carta.trim()) return NextResponse.json({ error: "Não foi possível gerar a carta." }, { status: 502 });

    return NextResponse.json({ carta });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
