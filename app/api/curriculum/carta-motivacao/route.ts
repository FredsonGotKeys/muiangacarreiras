import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";

/**
 * Gera Carta de Motivação (diferente da Carta de Apresentação — foca-se na
 * motivação pessoal, valores e ambição do candidato, não numa vaga concreta).
 * Nunca inventa experiência/competências fora do que já está no CV.
 */
function buildCandidatoSummary(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Nome: ${data.nome || "(não preenchido)"}`);
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
- Usa APENAS a informação fornecida sobre o candidato. Nunca inventes experiência, formação, prémios ou motivações que não estejam implícitas nos dados.
- Tom pessoal, sincero e reflexivo — mas profissional.
- Estrutura: abertura pessoal, ligação entre o percurso do candidato e o objectivo, valores/motivação genuína, fecho com compromisso.
- Português de Moçambique/Portugal (não brasileiro).
- Máximo 350 palavras.
- Devolve APENAS o texto da carta, sem explicações, sem markdown, sem títulos.`;

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

    const carta = result.content;
    if (!carta.trim()) return NextResponse.json({ error: "Não foi possível gerar a carta." }, { status: 502 });

    return NextResponse.json({ carta });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
