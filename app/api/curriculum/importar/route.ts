import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { chatCompletion } from "@/lib/llm";
import { getDocumentProxy, extractText } from "unpdf";

/**
 * Importa um CV existente (PDF ou DOCX) e estrutura os campos via IA,
 * devolvendo um objecto compatível com CvData para pré-preencher o formulário.
 * Nunca inventa dados — campos não encontrados ficam vazios.
 *
 * Extracção de texto local (unpdf para PDF, mammoth para DOCX) + Groq
 * estrutura o JSON. unpdf usa uma build do pdf.js feita para ambientes
 * serverless, sem dependências nativas — ao contrário de pdf-parse, que
 * precisa de DOMMatrix/Path2D/ImageData (APIs de browser) para PDFs com
 * fontes Type3/vectoriais, e rebentava em produção mesmo com o binário
 * nativo instalado.
 */
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_DOC_EXT = [".pdf", ".docx"];

const JSON_SCHEMA = `{
  "nome": "",
  "titulo": "",
  "telefone": "",
  "email": "",
  "endereco": "",
  "cidade": "",
  "linkedin": "",
  "objectivo": "",
  "formacao": [{ "instituicao": "", "curso": "", "grau": "", "anoInicio": "", "anoFim": "", "descricao": "" }],
  "experiencia": [{ "empresa": "", "cargo": "", "local": "", "dataInicio": "", "dataFim": "", "actualmente": false, "descricao": "" }],
  "competenciasTecnicas": [],
  "competenciasInformaticas": [],
  "linguas": [{ "lingua": "", "nivel": "" }]
}`;

const REGRAS = `REGRAS ABSOLUTAS:
- Extrai APENAS informação que está explicitamente visível/presente. Nunca inventes, nunca adivinhes dados que não existem.
- Se um campo não for encontrado, usa string vazia "" ou array vazio [].
- Datas no formato que encontrares (não convertas).
- Devolve APENAS JSON válido, sem markdown, sem explicações, neste formato exacto:
${JSON_SCHEMA}`;

async function extractDocText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error("Formato não suportado");
}

async function extrairViaGroq(texto: string): Promise<Record<string, unknown>> {
  const systemPrompt = `És um assistente especializado em extrair dados estruturados de currículos.

Vais receber o texto bruto extraído de um CV. O texto pode ter formatação irregular por vir de PDF/DOCX.

${REGRAS}`;

  const result = await chatCompletion({
    maxTokens: 2000,
    temperature: 0.1,
    jsonMode: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Texto do CV:\n\n${texto.slice(0, 8000)}` },
    ],
  });

  if (!result.ok) {
    throw new Error(`Geração falhou: HTTP ${result.status}`);
  }
  return JSON.parse(result.content || "{}");
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 4))) return rateLimitedResponse();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  try {
    const formData = await req.formData();
    const docFile = formData.get("file") as File | null;

    if (!docFile) {
      return NextResponse.json({ error: "Ficheiro necessário." }, { status: 400 });
    }
    if (docFile.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ficheiro demasiado grande (máx 8 MB)." }, { status: 400 });
    }
    const name = docFile.name.toLowerCase();
    if (!ALLOWED_DOC_EXT.some(ext => name.endsWith(ext))) {
      return NextResponse.json({ error: "Formato não suportado. Usa PDF ou DOCX." }, { status: 400 });
    }

    let texto: string;
    try {
      texto = await extractDocText(docFile);
    } catch (e) {
      await logError({ route: "/api/curriculum/importar", message: "extractDocText falhou", detail: String(e), userId: user.id });
      return NextResponse.json({ error: "Não foi possível ler o ficheiro. Verifica se não está protegido ou corrompido." }, { status: 422 });
    }
    if (!texto || texto.trim().length < 40) {
      return NextResponse.json({ error: "Não foi possível extrair texto suficiente deste ficheiro." }, { status: 422 });
    }

    let extraido: Record<string, unknown>;
    try {
      extraido = await extrairViaGroq(texto);
    } catch (e) {
      await logError({ route: "/api/curriculum/importar", message: "Groq falhou", detail: String(e), userId: user.id });
      return NextResponse.json({ error: "Erro ao processar o CV." }, { status: 502 });
    }

    return NextResponse.json({ extraido });
  } catch (e) {
    await logError({ route: "/api/curriculum/importar", message: "Erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
