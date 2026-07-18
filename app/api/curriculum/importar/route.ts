import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { chatCompletion } from "@/lib/llm";

/**
 * Importa um CV existente (PDF, DOCX ou foto) e estrutura os campos via IA,
 * devolvendo um objecto compatível com CvData para pré-preencher o formulário.
 * Nunca inventa dados — campos não encontrados ficam vazios.
 *
 * PDF/DOCX → extracção de texto local + Groq estrutura o JSON.
 * Foto (JPG/PNG/WEBP)  → Gemini Vision lê a imagem directamente e devolve o
 * JSON estruturado numa única chamada — mais preciso que OCR + correcção.
 */
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_DOC_EXT = [".pdf", ".docx"];
const ALLOWED_IMG_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
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

async function extrairViaGeminiVision(file: File, apiKey: string): Promise<Record<string, unknown>> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const prompt = `És um assistente especializado em extrair dados estruturados de currículos a partir de uma FOTO.

A imagem pode ter alguma perspectiva, sombra ou desfoque — lê apenas o que estiver claramente legível.

${REGRAS}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: file.type, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Gemini falhou: HTTP ${res.status} — ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(raw);
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
    const imageFile = formData.get("image") as File | null;

    let extraido: Record<string, unknown>;

    if (imageFile) {
      // Fluxo foto — Gemini Vision lê directamente, sem OCR intermédio
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return NextResponse.json({ error: "Serviço de leitura de imagem indisponível." }, { status: 503 });

      if (imageFile.size > MAX_BYTES) {
        return NextResponse.json({ error: "Imagem demasiado grande (máx 8 MB)." }, { status: 400 });
      }
      if (!ALLOWED_IMG_MIME.has(imageFile.type)) {
        return NextResponse.json({ error: "Formato de imagem não suportado. Usa JPG, PNG ou WEBP." }, { status: 400 });
      }

      try {
        extraido = await extrairViaGeminiVision(imageFile, geminiKey);
      } catch (e) {
        await logError({ route: "/api/curriculum/importar", message: "Gemini Vision falhou", detail: String(e), userId: user.id });
        return NextResponse.json({ error: "Não foi possível ler a foto. Tenta uma imagem mais nítida e bem iluminada." }, { status: 502 });
      }
    } else if (docFile) {
      // Fluxo ficheiro — PDF/DOCX
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
        return NextResponse.json({ error: "Não foi possível extrair texto suficiente. Se o CV for uma imagem, usa a opção de importar por foto." }, { status: 422 });
      }

      try {
        extraido = await extrairViaGroq(texto);
      } catch (e) {
        await logError({ route: "/api/curriculum/importar", message: "Groq falhou", detail: String(e), userId: user.id });
        return NextResponse.json({ error: "Erro ao processar o CV." }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: "Ficheiro ou imagem necessários." }, { status: 400 });
    }

    return NextResponse.json({ extraido });
  } catch (e) {
    await logError({ route: "/api/curriculum/importar", message: "Erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
