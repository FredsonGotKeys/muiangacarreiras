import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";
import { getTipoDocumento } from "@/lib/documentos-tipos";

/**
 * Gera qualquer documento do catálogo "diversos" (cartas, requerimentos,
 * declarações) a partir dos dados pessoais (tipo BI moçambicano) + detalhes
 * livres do utilizador. A geração é livre e imediata — a cobrança acontece
 * só ao copiar/descarregar (mesma lógica das restantes ferramentas).
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
    const tipoSlug = str(body?.tipo, 80);
    const tipo = tipoSlug ? getTipoDocumento(tipoSlug) : undefined;
    if (!tipo) return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });

    const nome = str(body?.nome, 200) ?? "";
    const bi = str(body?.bi, 50) ?? "";
    const dataNascimento = str(body?.dataNascimento, 30) ?? "";
    const naturalidade = str(body?.naturalidade, 100) ?? "";
    const estadoCivil = str(body?.estadoCivil, 50) ?? "";
    const morada = str(body?.morada, 300) ?? "";
    const contacto = str(body?.contacto, 200) ?? "";
    const entidade = str(body?.entidade, 200) ?? "";
    const segundaPessoaNome = str(body?.segundaPessoaNome, 200) ?? "";
    const segundaPessoaBi = str(body?.segundaPessoaBi, 50) ?? "";
    const detalhes = str(body?.detalhes, 3000) ?? "";

    if (!nome) return NextResponse.json({ error: "Indica o teu nome completo." }, { status: 400 });
    if (!detalhes) return NextResponse.json({ error: "Descreve os detalhes do pedido." }, { status: 400 });
    if (tipo.precisaEntidade && !entidade) {
      return NextResponse.json({ error: `Indica ${tipo.labelEntidade?.toLowerCase() ?? "a entidade"}.` }, { status: 400 });
    }
    if (tipo.precisaSegundaPessoa && !segundaPessoaNome) {
      return NextResponse.json({ error: "Indica o nome da segunda pessoa envolvida." }, { status: 400 });
    }

    const dadosRequerente = [
      `Nome completo: ${nome}`,
      bi && `Bilhete de Identidade nº: ${bi}`,
      dataNascimento && `Data de nascimento: ${dataNascimento}`,
      naturalidade && `Naturalidade: ${naturalidade}`,
      estadoCivil && `Estado civil: ${estadoCivil}`,
      morada && `Residência/Morada: ${morada}`,
      contacto && `Contacto: ${contacto}`,
    ].filter(Boolean).join("\n");

    const dadosExtra = [
      tipo.precisaEntidade && entidade && `${tipo.labelEntidade ?? "Entidade"}: ${entidade}`,
      tipo.precisaSegundaPessoa && segundaPessoaNome && `Nome da segunda pessoa: ${segundaPessoaNome}`,
      tipo.precisaSegundaPessoa && segundaPessoaBi && `BI da segunda pessoa: ${segundaPessoaBi}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `És um assistente moçambicano especializado em redigir documentos formais (cartas, requerimentos e declarações), cumprindo rigorosamente as regras de elaboração usadas em Moçambique — não é apenas prosa formal genérica, é a estrutura exacta que estas peças exigem.

DOCUMENTO A GERAR: ${tipo.titulo}
${tipo.instrucao}

REGRAS DE ESTRUTURA OBRIGATÓRIAS PARA ESTE TIPO DE DOCUMENTO (cumprir à risca):
${tipo.estrutura}

REGRAS ABSOLUTAS:
- Usa APENAS a informação fornecida pelo utilizador (dados pessoais, entidade, detalhes). Nunca inventes factos, datas, entidades, números de BI ou moradas que não estejam indicados.
- Integra os dados pessoais fornecidos (nome, BI, data de nascimento, naturalidade, estado civil, morada) no parágrafo de identificação do requerente/declarante, exactamente como as regras de estrutura acima descrevem — não os omitas nem os relegues para o fim.
- Se faltar alguma informação necessária para completar o documento correctamente, deixa um marcador claro entre parênteses rectos, ex.: [Data de emissão do BI], em vez de inventar.
- Tom formal, claro e directo — português de Moçambique/Portugal (nunca brasileiro).
- Devolve APENAS o texto do documento, sem explicações, sem markdown, sem títulos extra.`;

    const userMsg = `DADOS DO REQUERENTE/DECLARANTE:\n${dadosRequerente}${dadosExtra ? `\n\nDADOS ADICIONAIS:\n${dadosExtra}` : ""}\n\nDETALHES DO PEDIDO:\n${detalhes}`;

    const result = await chatCompletion({
      maxTokens: 800,
      temperature: 0.35,
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
