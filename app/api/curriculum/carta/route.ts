import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";

/**
 * Gera Carta de Apresentação personalizada a partir dos dados do CV.
 * Se `vaga` (empresa/cargo) não for fornecida, gera carta genérica de alta qualidade.
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

REGRAS ABSOLUTAS:
- Usa APENAS a informação fornecida sobre o candidato. Nunca inventes experiência, formação ou competências.
- Tom profissional, formal mas natural — adequado ao mercado de trabalho moçambicano.
- Estrutura: saudação, parágrafo de abertura (interesse na vaga/empresa), parágrafo central (experiência e valor que traz), parágrafo de fecho (disponibilidade, agradecimento), despedida.
- Português de Moçambique/Portugal (não brasileiro).
- Máximo 350 palavras.
- Devolve APENAS o texto da carta, sem explicações, sem markdown, sem títulos.`;

    const userMsg = `${contexto}\n\nDados do candidato:\n${resumo}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 700,
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Groq carta error:", err);
      return NextResponse.json({ error: "Erro ao gerar carta." }, { status: 502 });
    }

    const data = await res.json();
    const carta = data.choices?.[0]?.message?.content ?? "";
    if (!carta.trim()) return NextResponse.json({ error: "Não foi possível gerar a carta." }, { status: 502 });

    return NextResponse.json({ carta });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
