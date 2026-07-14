import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";

/**
 * Reescreve o objectivo e as descrições de experiência do CV optimizadas
 * para leitura por sistemas ATS (Applicant Tracking System): linguagem
 * simples, palavras-chave do sector, frases curtas com verbos de acção,
 * sem jargão visual. Nunca inventa experiência/competências novas — só
 * reformula o que já existe no CV do utilizador.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 6)) return rateLimitedResponse();

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
    const cvData = body.cvData as Record<string, unknown>;
    const objectivo = String(cvData.objectivo ?? "");
    const experiencia = Array.isArray(cvData.experiencia) ? cvData.experiencia : [];

    if (!objectivo && experiencia.length === 0) {
      return NextResponse.json({ error: "Preenche o objectivo ou a experiência antes de optimizar." }, { status: 400 });
    }

    const systemPrompt = `És um especialista em optimização de currículos para sistemas ATS (Applicant Tracking System).

REGRAS ABSOLUTAS:
- Usa APENAS a informação fornecida. Nunca inventes cargos, empresas, datas ou competências.
- Reescreve cada texto para: frases curtas, verbos de acção no início, palavras-chave relevantes do sector já mencionado, sem caracteres especiais nem formatação visual.
- Mantém o significado e os factos exactamente iguais — só melhora a forma como um ATS os interpreta.

Recebes um JSON com "objectivo" (string) e "experiencia" (array de {cargo, empresa, descricao}).
Devolve APENAS um JSON válido no mesmo formato: {"objectivo": "...", "experiencia": [{"cargo":"...","empresa":"...","descricao":"..."}]}. Cargo e empresa mantêm-se inalterados — só "objectivo" e "descricao" são reescritos.`;

    const userMsg = JSON.stringify({
      objectivo,
      experiencia: experiencia.map((e) => {
        const exp = e as Record<string, unknown>;
        return { cargo: exp.cargo ?? "", empresa: exp.empresa ?? "", descricao: exp.descricao ?? "" };
      }),
    });

    const result = await chatCompletion({
      maxTokens: 1200,
      temperature: 0.3,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) return NextResponse.json({ error: "Erro ao optimizar CV." }, { status: 502 });

    const raw = result.content || "{}";
    let parsed: { objectivo?: string; experiencia?: { cargo: string; empresa: string; descricao: string }[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Resposta inválida. Tenta novamente." }, { status: 502 });
    }

    return NextResponse.json({
      objectivo: parsed.objectivo ?? objectivo,
      experiencia: parsed.experiencia ?? [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
