import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";

const IDIOMAS: Record<string, string> = { en: "inglês", fr: "francês" };

/**
 * Traduz os campos de texto do CV (título, objectivo, descrições de
 * experiência e formação) para inglês ou francês. Nunca inventa
 * informação — só traduz o que já existe.
 */
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
    const idioma = typeof body?.idioma === "string" ? body.idioma : "";
    if (!IDIOMAS[idioma]) return NextResponse.json({ error: "Idioma inválido." }, { status: 400 });
    if (!body?.cvData || typeof body.cvData !== "object") {
      return NextResponse.json({ error: "Dados do CV em falta." }, { status: 400 });
    }
    const cvData = body.cvData as Record<string, unknown>;
    const experiencia = Array.isArray(cvData.experiencia) ? cvData.experiencia : [];
    const formacao = Array.isArray(cvData.formacao) ? cvData.formacao : [];

    const systemPrompt = `És um tradutor profissional especializado em currículos, traduzindo de português para ${IDIOMAS[idioma]}.

REGRAS ABSOLUTAS:
- Traduz apenas o texto fornecido, sem adicionar, remover ou inventar informação.
- Mantém nomes próprios, nomes de empresas e instituições inalterados.
- Usa terminologia profissional adequada a currículos em ${IDIOMAS[idioma]}.

Recebes um JSON e devolves APENAS um JSON válido na mesma estrutura, com os campos de texto traduzidos: {"titulo":"...","objectivo":"...","experiencia":[{"cargo":"...","descricao":"..."}],"formacao":[{"curso":"...","descricao":"..."}]}. Não traduzas "empresa" nem "instituicao".`;

    const userMsg = JSON.stringify({
      titulo: cvData.titulo ?? "",
      objectivo: cvData.objectivo ?? "",
      experiencia: experiencia.map((e) => {
        const exp = e as Record<string, unknown>;
        return { cargo: exp.cargo ?? "", descricao: exp.descricao ?? "" };
      }),
      formacao: formacao.map((f) => {
        const form = f as Record<string, unknown>;
        return { curso: form.curso ?? "", descricao: form.descricao ?? "" };
      }),
    });

    const result = await chatCompletion({
      maxTokens: 1500,
      temperature: 0.3,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) return NextResponse.json({ error: "Erro ao traduzir CV." }, { status: 502 });

    const raw = result.content || "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Resposta inválida. Tenta novamente." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
