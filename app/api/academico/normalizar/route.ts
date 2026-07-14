import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { chatCompletion } from "@/lib/llm";

const NORMAS = new Set(["APA", "Vancouver", "Harvard"]);

/** Normaliza uma lista de referências já fornecidas pelo utilizador para a norma escolhida. Nunca inventa fontes novas. */
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
  const referencias = str(body?.referencias, 8000);
  const norma = typeof body?.norma === "string" && NORMAS.has(body.norma) ? body.norma : "APA";
  if (!referencias) return NextResponse.json({ error: "Cola as referências a normalizar." }, { status: 400 });

  const systemPrompt = `És um especialista em normas bibliográficas académicas.

Vais receber uma lista de referências (possivelmente mal formatadas ou incompletas) fornecidas pelo utilizador.

REGRAS ABSOLUTAS:
- Reformata CADA referência fornecida para a norma ${norma}.
- NUNCA inventes referências novas, autores, datas ou dados que não estavam na lista original.
- Se uma referência estiver incompleta (faltar autor, ano, etc.), mantém-na o mais completa possível com o que existe e assinala com [dados incompletos — verificar] no fim dessa entrada.
- Não removas nem adiciones referências — só reformata as que recebeste.

Devolve APENAS JSON válido: { "referenciasNormalizadas": ["ref 1 formatada", "ref 2 formatada", "..."] }`;

  try {
    const result = await chatCompletion({
      maxTokens: 3000,
      temperature: 0.1,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: referencias },
      ],
    });
    if (!result.ok) {
      await logError({ route: "/api/academico/normalizar", message: "Geração falhou", detail: `HTTP ${result.status}`, userId: user.id, statusCode: result.status });
      return NextResponse.json({ error: "Erro ao normalizar as referências." }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(result.content || "{}"));
  } catch (e) {
    await logError({ route: "/api/academico/normalizar", message: "Erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
