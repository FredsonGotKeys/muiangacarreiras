import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";

/**
 * Gera um guião de preparação para entrevista: perguntas prováveis
 * (comportamentais + técnicas, baseadas no perfil do candidato e,
 * opcionalmente, no texto da vaga) com dicas de como responder.
 * Nunca inventa experiência do candidato — as dicas baseiam-se apenas
 * no que já está no CV.
 */
function buildCvSummary(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Título: ${data.titulo || "(não preenchido)"}`);
  lines.push(`Objectivo: ${data.objectivo || "(não preenchido)"}`);
  const experiencia = Array.isArray(data.experiencia) ? data.experiencia : [];
  lines.push(`\nExperiência:`);
  experiencia.forEach((e: Record<string, unknown>) => {
    lines.push(`- ${e.cargo ?? "?"} em ${e.empresa ?? "?"}: ${e.descricao ?? ""}`);
  });
  const tecnicas = Array.isArray(data.competenciasTecnicas) ? data.competenciasTecnicas : [];
  lines.push(`\nCompetências técnicas: ${tecnicas.join(", ") || "(nenhuma)"}`);
  return lines.join("\n");
}

interface Pergunta { pergunta: string; dica: string; }
interface EntrevistaResult { perguntas: Pergunta[]; }

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
    const vagaTexto = str(body?.vagaTexto, 6000);
    const resumo = buildCvSummary(body.cvData).slice(0, 6000);

    const contexto = vagaTexto
      ? `Contexto da vaga a que o candidato se vai candidatar:\n${vagaTexto}`
      : `Não foi fornecida uma vaga específica — gera perguntas gerais de entrevista adequadas ao perfil do candidato.`;

    const systemPrompt = `És um recrutador sénior moçambicano a preparar um candidato para uma entrevista de emprego.

REGRAS ABSOLUTAS:
- Gera 8 perguntas prováveis (mistura de comportamentais e técnicas, adequadas ao perfil e, se fornecida, à vaga).
- Para cada pergunta, dá uma dica curta de como o candidato pode estruturar a resposta usando APENAS a sua experiência real (indicada no resumo) — nunca inventes experiência que ele não tem.
- Português de Moçambique/Portugal.

Devolve APENAS JSON válido: {"perguntas": [{"pergunta": "...", "dica": "..."}, ...]} com exactamente 8 itens.`;

    const result = await chatCompletion({
      maxTokens: 1500,
      temperature: 0.5,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${contexto}\n\nCandidato:\n${resumo}` },
      ],
    });

    if (!result.ok) return NextResponse.json({ error: "Erro ao gerar guião de entrevista." }, { status: 502 });

    const raw = result.content || "{}";
    let parsed: EntrevistaResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Resposta inválida. Tenta novamente." }, { status: 502 });
    }
    if (!Array.isArray(parsed.perguntas) || parsed.perguntas.length === 0) {
      return NextResponse.json({ error: "Guião incompleto. Tenta novamente." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
