import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

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
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: referencias },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      await logError({ route: "/api/academico/normalizar", message: "Groq falhou", detail: err, userId: user.id, statusCode: res.status });
      return NextResponse.json({ error: "Erro ao normalizar as referências." }, { status: 502 });
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    await logError({ route: "/api/academico/normalizar", message: "Erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
