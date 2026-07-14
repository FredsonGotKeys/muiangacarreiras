import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";
import { getTipoDocumento } from "@/lib/documentos-tipos";

/**
 * Gera qualquer documento do catálogo "diversos" (cartas, requerimentos,
 * declarações) a partir de nome/contacto + detalhes livres do utilizador.
 * A geração é livre e imediata — a cobrança acontece só ao copiar/descarregar
 * (mesma lógica das restantes ferramentas de documentos).
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
    const tipoSlug = str(body?.tipo, 80);
    const tipo = tipoSlug ? getTipoDocumento(tipoSlug) : undefined;
    if (!tipo) return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });

    const nome = str(body?.nome, 200) ?? "";
    const contacto = str(body?.contacto, 200) ?? "";
    const detalhes = str(body?.detalhes, 3000) ?? "";
    if (!nome) return NextResponse.json({ error: "Indica o teu nome completo." }, { status: 400 });
    if (!detalhes) return NextResponse.json({ error: "Descreve os detalhes do pedido." }, { status: 400 });

    const systemPrompt = `És um assistente moçambicano especializado em redigir documentos formais (cartas, requerimentos e declarações) no formato e tom usados em Moçambique.

DOCUMENTO A GERAR: ${tipo.titulo}
${tipo.instrucao}

REGRAS ABSOLUTAS:
- Usa APENAS a informação fornecida pelo utilizador (nome, contacto, detalhes). Nunca inventes factos, datas, entidades ou números que não estejam indicados.
- Se faltar alguma informação necessária para completar o documento (ex.: nome da entidade destinatária, número de BI), deixa um marcador claro entre parênteses rectos, ex.: [Nome da entidade].
- Tom formal, claro e directo — português de Moçambique/Portugal (nunca brasileiro).
- Estrutura própria de um documento formal moçambicano: local e data, saudação/vocativo apropriado, corpo do texto, despedida formal, assinatura.
- Devolve APENAS o texto do documento, sem explicações, sem markdown, sem títulos extra.`;

    const userMsg = `Nome do requerente: ${nome}\nContacto: ${contacto || "(não indicado)"}\n\nDetalhes do pedido:\n${detalhes}`;

    const result = await chatCompletion({
      maxTokens: 700,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Erro ao gerar o documento." }, { status: 502 });
    }

    const texto = result.content;
    if (!texto.trim()) return NextResponse.json({ error: "Não foi possível gerar o documento." }, { status: 502 });

    return NextResponse.json({ texto });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
