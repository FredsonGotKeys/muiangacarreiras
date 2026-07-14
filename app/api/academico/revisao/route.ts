import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { chatCompletion } from "@/lib/llm";

/** Revisão científica: corrige gramática, ortografia e coerência de um texto já escrito pelo utilizador. */
export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 6)) return rateLimitedResponse();

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const texto = str(body?.texto, 12000);
  if (!texto) return NextResponse.json({ error: "Cola o texto a rever." }, { status: 400 });

  const systemPrompt = `És um revisor científico especializado em trabalhos académicos em Português de Portugal.

REGRAS:
- Corrige gramática, ortografia, pontuação e coerência textual.
- Melhora terminologia científica quando apropriado, sem alterar o significado.
- NUNCA inventes ou adicionas informação, dados ou referências que não estavam no texto original.
- Mantém o texto em Português europeu (nunca brasileiro).

Devolve APENAS JSON válido: { "textoCorrigido": "...", "alteracoes": ["resumo curto de cada alteração relevante feita", "..."] }`;

  try {
    const result = await chatCompletion({
      maxTokens: 4000,
      temperature: 0.2,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: texto },
      ],
    });
    if (!result.ok) {
      await logError({ route: "/api/academico/revisao", message: "Geração falhou", detail: `HTTP ${result.status}`, userId: user.id, statusCode: result.status });
      return NextResponse.json({ error: "Erro ao rever o texto." }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(result.content || "{}"));
  } catch (e) {
    await logError({ route: "/api/academico/revisao", message: "Erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
