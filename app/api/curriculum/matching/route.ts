import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";

/**
 * Compara o CV do utilizador com o texto de uma vaga de emprego e calcula
 * compatibilidade. A vaga é fornecida como texto colado (PDF/imagem ficam
 * fora do escopo desta fase — o utilizador cola a descrição da vaga).
 * A IA nunca sugere adicionar competências/experiência que o candidato não tem.
 */
interface MatchResult {
  compatibilidade: number;
  competenciasEncontradas: string[];
  competenciasEmFalta: string[];
  sugestoes: string[];
}

function buildCvSummary(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Título: ${data.titulo || "(não preenchido)"}`);
  lines.push(`Objectivo: ${data.objectivo || "(não preenchido)"}`);

  const experiencia = Array.isArray(data.experiencia) ? data.experiencia : [];
  lines.push(`\nExperiência:`);
  experiencia.forEach((e: Record<string, unknown>) => {
    lines.push(`- ${e.cargo ?? "?"} em ${e.empresa ?? "?"}: ${e.descricao ?? ""}`);
  });

  const formacao = Array.isArray(data.formacao) ? data.formacao : [];
  lines.push(`\nFormação:`);
  formacao.forEach((f: Record<string, unknown>) => {
    lines.push(`- ${f.grau ?? ""} em ${f.curso ?? "?"} — ${f.instituicao ?? "?"}`);
  });

  const tecnicas = Array.isArray(data.competenciasTecnicas) ? data.competenciasTecnicas : [];
  const informaticas = Array.isArray(data.competenciasInformaticas) ? data.competenciasInformaticas : [];
  lines.push(`\nCompetências técnicas: ${tecnicas.join(", ") || "(nenhuma)"}`);
  lines.push(`Competências informáticas: ${informaticas.join(", ") || "(nenhuma)"}`);

  const linguas = Array.isArray(data.linguas) ? data.linguas : [];
  lines.push(`Idiomas: ${linguas.map((l: Record<string, unknown>) => `${l.lingua} (${l.nivel})`).join(", ") || "(nenhum)"}`);

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 6)) return rateLimitedResponse();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  try {
    const body = await req.json().catch(() => null);
    const vagaTexto = str(body?.vagaTexto, 6000);
    if (!body?.cvData || !vagaTexto) {
      return NextResponse.json({ error: "Dados do CV e texto da vaga são necessários." }, { status: 400 });
    }

    // Cap defensivo — body.cvData não tem limite de tamanho por campo (só no cliente);
    // sem isto um payload gigante custaria tokens Groq sem limite.
    const resumoCv = buildCvSummary(body.cvData).slice(0, 6000);

    const systemPrompt = `És um especialista em recrutamento que compara currículos com vagas de emprego.

REGRAS ABSOLUTAS:
- Compara apenas o que está no CV com os requisitos da vaga.
- Nunca sugiras que o candidato tenha uma competência que não está no CV — apenas identifica o que falta.
- "sugestoes" deve conter formas de REALÇAR o que já existe (reordenar, dar mais destaque), nunca inventar.
- Pontuação de compatibilidade 0-100 baseada em correspondência real entre requisitos e perfil.

Devolve APENAS JSON válido neste formato:
{
  "compatibilidade": <0-100>,
  "competenciasEncontradas": ["<competência que o CV tem e a vaga pede>", "..."],
  "competenciasEmFalta": ["<requisito da vaga que não está no CV>", "..."],
  "sugestoes": ["<sugestão accionável para melhor destacar o que já tem>", "..."]
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 900,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `CURRÍCULO:\n${resumoCv}\n\nVAGA:\n${vagaTexto}` },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Groq matching error:", err);
      return NextResponse.json({ error: "Erro ao comparar com a vaga." }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: MatchResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Resposta inválida. Tenta novamente." }, { status: 502 });
    }

    if (typeof parsed.compatibilidade !== "number") {
      return NextResponse.json({ error: "Análise incompleta. Tenta novamente." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
