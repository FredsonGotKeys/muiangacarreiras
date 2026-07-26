import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";
import { juntarLinhasPartidas } from "@/lib/normalizar-texto";

/**
 * Gera Carta de Motivação (diferente da Carta de Apresentação — foca-se na
 * motivação pessoal, valores e ambição do candidato, não numa vaga concreta).
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
  }

  const formacao = Array.isArray(data.formacao) ? data.formacao : [];
  if (formacao.length) {
    const f = formacao[0] as Record<string, unknown>;
    lines.push(`\nFormação: ${f.grau ?? ""} em ${f.curso ?? "?"} — ${f.instituicao ?? "?"}`);
  }

  const tecnicas = Array.isArray(data.competenciasTecnicas) ? data.competenciasTecnicas : [];
  if (tecnicas.length) lines.push(`\nCompetências: ${tecnicas.join(", ")}`);

  return lines.join("\n");
}

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
    if (!body?.cvData || typeof body.cvData !== "object") {
      return NextResponse.json({ error: "Dados do CV em falta." }, { status: 400 });
    }

    const instituicao = str(body.instituicao, 200);
    const objectivo = str(body.objectivoEspecifico, 300); // ex: bolsa, mestrado, voluntariado
    const resumo = buildCandidatoSummary(body.cvData).slice(0, 6000);

    const contexto = objectivo || instituicao
      ? `A carta destina-se a: ${objectivo ?? "(não especificado)"}${instituicao ? ` — em "${instituicao}"` : ""}.`
      : `Não foi especificado um objectivo concreto — gera uma carta de motivação genérica de alta qualidade, focada em valores e ambição pessoal/profissional.`;

    const systemPrompt = `És um consultor de carreira moçambicano especializado em cartas de motivação.

Uma carta de motivação é diferente de uma carta de apresentação para uma vaga: foca-se em PORQUÊ o candidato quer aquela oportunidade (bolsa, curso, voluntariado, programa), nos seus valores, ambição pessoal e ligação genuína ao objectivo — não apenas nas suas qualificações técnicas.

REGRAS ABSOLUTAS:
- FORMATAÇÃO DE LINHAS: cada parágrafo de prosa tem de ser devolvido numa ÚNICA linha contínua, sem nenhuma quebra de linha (\n) no meio da frase, seja qual for o comprimento. Só usa quebra de linha para separar blocos estruturais distintos: cabeçalho, "Assunto:", um parágrafo completo do seguinte, e a assinatura. Nunca termines uma linha a meio de uma frase numa preposição ou conjunção (ex.: "...e", "...de", "...a").
- Usa APENAS a informação fornecida sobre o candidato. Nunca inventes experiência, formação, prémios ou motivações que não estejam implícitas nos dados.
- Tom pessoal, sincero e reflexivo — mas profissional. Escreve como um consultor de carreira experiente, não como um assistente de IA a ser simpático.
- Estrutura obrigatória, exactamente por esta ordem:
  1. Cabeçalho: "Exmo(a). Senhor(a)" seguido de "Director(a)" (ou cargo equivalente) e o nome da instituição (ou "___________________________" se não for fornecida), cada um numa linha. (Aqui "(a)" é aceitável — é o destinatário, cujo género é desconhecido.)
  2. Uma linha em branco, depois "Assunto: Carta de Motivação — [objectivo]" (ou "Assunto: Carta de Motivação" se o objectivo não for especificado).
  3. Uma linha em branco, depois a abertura pessoal DEVE começar literalmente por "Eu, [Nome completo]" seguido, quando os dados existirem, de ", [nascido/nascida] aos [data de nascimento]", ", [portador/portadora] do Bilhete de Identidade/DIRE n.º [BI/DIRE]", ", de nacionalidade [nacionalidade]" e ", residente em [endereço/cidade]" — escrito como texto corrido e natural (nunca uma lista mecânica de campos), omitindo qualquer segmento cujo dado não tenha sido fornecido, sem inventar nem usar reticências. A frase termina por introduzir o objectivo da carta.
  4. Ligação entre o percurso do candidato e o objectivo.
  5. Valores/motivação genuína.
  6. Fecho com compromisso e, quando fornecidos, forma de contacto (telefone/email).
  7. Despedida formal (ex: "Com os melhores cumprimentos,") seguida do nome completo do candidato.
- CONCORDÂNCIA DE GÉNERO: usa o campo "Sexo/Género" do candidato para escolher a forma certa das palavras que o descrevem (nascido/nascida, portador/portadora) — nunca escrevas a forma dupla com barra "(a)" para descrever o PRÓPRIO candidato. Se o género não tiver sido indicado, usa a forma masculina por defeito, nunca a forma com barra.
- Nunca uses fórmulas traduzidas do inglês ou efusivas que soam a IA (ex.: "Espero que esta mensagem o encontre bem", "É com enorme satisfação/imenso prazer que..."). Fórmulas formais moçambicanas (ex.: "Venho por este meio...", "Tenho a honra de...") são as correctas.
- Português de Moçambique/Portugal (não brasileiro).
- Máximo 380 palavras.
- Devolve APENAS o texto da carta, sem explicações, sem markdown, sem títulos adicionais.`;

    const userMsg = `${contexto}\n\nDados do candidato:\n${resumo}`;

    const result = await chatCompletion({
      maxTokens: 700,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Erro ao gerar carta de motivação." }, { status: 502 });
    }

    const carta = juntarLinhasPartidas(result.content);
    if (!carta.trim()) return NextResponse.json({ error: "Não foi possível gerar a carta." }, { status: 502 });

    return NextResponse.json({ carta });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
