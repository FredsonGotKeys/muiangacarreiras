import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 12))) return rateLimitedResponse();

  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    const texto = str(body.texto, 4000);
    const contexto = str(body.contexto, 200);
    if (!texto) return NextResponse.json({ error: "Texto vazio ou demasiado longo." }, { status: 400 });

    const systemPrompt = `És um consultor de carreira sénior especializado em currículos profissionais.
A tua tarefa é melhorar o texto que o utilizador escreveu para o seu CV, tornando-o:
- Mais profissional e impactante
- Com verbos de acção fortes
- Conciso mas completo
- Adequado ao contexto do campo do CV
- Em português correcto (variante moçambicana/portuguesa)

REGRAS:
- Devolve APENAS o texto melhorado, sem explicações
- Mantém o sentido original
- Não inventes informação nova
- Máximo 3-4 frases para objectivos, 2-3 linhas por experiência
- Usa linguagem formal mas acessível`;

    const userMsg = contexto
      ? `Campo do CV: ${contexto}\n\nTexto original:\n${texto}`
      : `Texto original:\n${texto}`;

    const result = await chatCompletion({
      maxTokens: 500,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Erro ao processar texto." }, { status: 502 });
    }

    return NextResponse.json({ texto: result.content });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
