import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { SECOES, type SecaoId, type NivelAcademico } from "@/lib/academico-sections";

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

interface FormData {
  tema: string; area: string; nivel: NivelAcademico; paginas: string;
  instituicao: string; faculdade: string; curso: string; disciplina: string;
  docente: string; orientador: string; autores: string; numerosEstudante: string;
  cidade: string; ano: string;
  mostrarLogo: boolean;
  secoes: SecaoId[];
}

const NIVEL_LABEL: Record<NivelAcademico, string> = {
  secundario: "Ensino Secundário", tecnico: "Ensino Técnico Profissional",
  licenciatura: "Licenciatura", "pos-graduacao": "Pós-graduação",
  mestrado: "Mestrado", doutoramento: "Doutoramento",
};

/** Chama o Groq uma única vez para gerar o conteúdo de todas as secções IA seleccionadas. */
async function gerarConteudoIA(form: FormData, secoesIA: SecaoId[], apiKey: string): Promise<Record<string, string>> {
  if (secoesIA.length === 0) return {};

  const nivelLabel = NIVEL_LABEL[form.nivel];
  const profundidade =
    form.nivel === "secundario" || form.nivel === "tecnico" ? "simples e directa, sem jargão excessivo"
    : form.nivel === "mestrado" || form.nivel === "doutoramento" ? "com elevado rigor científico, profundidade analítica e densidade teórica"
    : "completa, estruturada e academicamente sólida";

  const secaoLabels = secoesIA.map(id => SECOES.find(s => s.id === id)?.label ?? id);

  const systemPrompt = `És um assistente académico especializado em redigir trabalhos científicos para estudantes moçambicanos.

CONTEXTO DO TRABALHO:
- Tema: ${form.tema}
- Área: ${form.area || "(não especificada)"}
- Nível académico: ${nivelLabel}
- Profundidade esperada: ${profundidade}

REGRAS ABSOLUTAS (nunca violar):
1. Escreve em Português de Portugal (europeu). NUNCA uses Português do Brasil (nada de "você", "ônibus", gerúndio contínuo tipo "estou fazendo" — usa "estou a fazer").
2. A secção "Abstract" é a única excepção — escreve-a em inglês.
3. NUNCA inventes referências bibliográficas, nomes de autores, datas de publicação ou estatísticas/dados numéricos concretos. Se precisares de exemplificar, usa linguagem genérica como "estudos recentes sugerem que..." sem atribuir a uma fonte específica, e adiciona uma nota entre colchetes: [Valida e adiciona a referência real aqui].
4. Sempre que a informação for insuficiente para desenvolver algo com precisão, sinaliza claramente com [A validar pelo utilizador] em vez de inventar.
5. Privilegia exemplos da realidade moçambicana sempre que fizer sentido para o tema.
6. O texto é uma BASE DE TRABALHO — nunca afirmes que está pronto para submissão definitiva.

Devolve APENAS um JSON válido, sem markdown, no formato:
{ "<id_da_secção>": "<texto da secção>", ... }

As chaves devem ser exactamente estas (nesta grafia): ${secoesIA.join(", ")}
Secções a desenvolver: ${secaoLabels.join(", ")}.
Cada secção deve ter entre 2 a 5 parágrafos, excepto Objectivo Geral/Hipóteses que podem ser mais curtas (1 parágrafo ou lista).`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 6000,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Gera o conteúdo académico para o trabalho descrito.` },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Groq falhou: HTTP ${res.status} — ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Resposta da IA não é JSON válido.");
  }
}

async function construirDocx(
  form: FormData,
  conteudoIA: Record<string, string>,
  logoBuffer: Buffer | null
): Promise<Buffer> {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    TableOfContents, PageNumber, Footer, ImageRun, NumberFormat, LevelFormat,
  } = await import("docx");

  const FONT = "Times New Roman";
  const secoesSelecionadas = SECOES.filter(s => form.secoes.includes(s.id));
  const preliminares = secoesSelecionadas.filter(s => s.grupo === "preliminar");
  const corpo = secoesSelecionadas.filter(s => s.grupo === "corpo");
  const finais = secoesSelecionadas.filter(s => s.grupo === "final");

  const bodyRun = (text: string) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 360, after: 200 }, // 1.5 linhas
      indent: { firstLine: 700 },
      children: [new TextRun({ text, font: FONT, size: 24 })],
    });

  const heading1 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 240 },
      children: [new TextRun({ text: text.toUpperCase(), font: FONT, bold: true, size: 28 })],
    });

  // ── CAPA ──
  const capaChildren: InstanceType<typeof Paragraph>[] = [];
  if (form.instituicao) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: form.instituicao.toUpperCase(), font: FONT, bold: true, size: 26 })] }));
  if (form.faculdade) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: form.faculdade, font: FONT, size: 24 })] }));
  if (form.curso) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: form.curso, font: FONT, size: 24 })], spacing: { after: 400 } }));

  if (logoBuffer && form.mostrarLogo) {
    capaChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [new ImageRun({ data: logoBuffer, transformation: { width: 110, height: 110 }, type: "png" })],
    }));
  } else {
    capaChildren.push(new Paragraph({ children: [], spacing: { after: 800 } }));
  }

  capaChildren.push(
    new Paragraph({ children: [], spacing: { before: 800 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: form.tema.toUpperCase(), font: FONT, bold: true, size: 32 })], spacing: { after: 800 } }),
  );

  const autoresLine = [form.autores, form.numerosEstudante ? `(N.º ${form.numerosEstudante})` : ""].filter(Boolean).join(" ");
  if (autoresLine) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: autoresLine, font: FONT, size: 24 })], spacing: { before: 600, after: 200 } }));
  if (form.docente) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Docente: ${form.docente}`, font: FONT, size: 22 })] }));
  if (form.orientador) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Orientador: ${form.orientador}`, font: FONT, size: 22 })] }));

  const localData = [form.cidade, form.ano].filter(Boolean).join(", ");
  if (localData) capaChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: localData, font: FONT, size: 22 })], spacing: { before: 800 } }));

  // ── PRELIMINARES (romano) ──
  const preliminaresChildren: InstanceType<typeof Paragraph | typeof TableOfContents>[] = [];
  for (const s of preliminares) {
    preliminaresChildren.push(heading1(s.label));
    if (s.id === "abstract") {
      preliminaresChildren.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 200 },
        children: [new TextRun({ text: conteudoIA.abstract ?? "[A gerar]", font: FONT, size: 24, italics: true })],
      }));
    } else if (s.geradaPorIA) {
      preliminaresChildren.push(bodyRun(conteudoIA[s.id] ?? "[A gerar]"));
    } else {
      preliminaresChildren.push(bodyRun("[Preencher: " + s.label.toLowerCase() + "]"));
    }
  }
  if (form.secoes.includes("listaFiguras" as SecaoId) || form.secoes.includes("listaTabelas" as SecaoId) || true) {
    preliminaresChildren.push(heading1("Índice"));
    preliminaresChildren.push(new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }));
  }

  // ── CORPO (árabe) ──
  const corpoChildren: InstanceType<typeof Paragraph>[] = [];
  for (const s of corpo) {
    corpoChildren.push(heading1(s.label));
    corpoChildren.push(bodyRun(conteudoIA[s.id] ?? "[Conteúdo a desenvolver — secção seleccionada mas sem geração disponível]"));
  }

  // ── FINAIS ──
  for (const s of finais) {
    corpoChildren.push(heading1(s.label));
    if (s.id === "referencias") {
      corpoChildren.push(bodyRun("[Adiciona aqui as tuas referências bibliográficas reais. A IA nunca inventa fontes — esta secção deve ser preenchida por ti, seguindo a norma exigida pela tua instituição.]"));
    } else {
      corpoChildren.push(bodyRun("[Adiciona aqui os teus anexos: tabelas, questionários, imagens ou documentos de apoio.]"));
    }
  }

  const footerArabic = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })],
  });
  const footerRoman = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })],
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 24 } } },
      paragraphStyles: [{
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, bold: true, size: 28 },
      }],
    },
    numbering: {
      config: [{
        reference: "toc-numbering",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }],
      }],
    },
    sections: [
      // Capa — sem número de página
      { properties: { titlePage: true, page: { pageNumbers: { start: 1 } } }, children: capaChildren },
      // Preliminares — numeração romana
      {
        properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
        footers: { default: footerRoman },
        children: preliminaresChildren,
      },
      // Corpo — numeração árabe
      {
        properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        footers: { default: footerArabic },
        children: corpoChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 4)) return rateLimitedResponse();

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sbUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sbUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  try {
    const formData = await req.formData();
    const raw = formData.get("dados") as string | null;
    if (!raw) return NextResponse.json({ error: "Dados do formulário em falta." }, { status: 400 });

    const parsed = JSON.parse(raw);
    const tema = str(parsed.tema, 300);
    if (!tema) return NextResponse.json({ error: "O tema é obrigatório." }, { status: 400 });

    const form: FormData = {
      tema,
      area: str(parsed.area, 150) ?? "",
      nivel: (parsed.nivel as NivelAcademico) ?? "licenciatura",
      paginas: str(parsed.paginas, 20) ?? "",
      instituicao: str(parsed.instituicao, 200) ?? "",
      faculdade: str(parsed.faculdade, 200) ?? "",
      curso: str(parsed.curso, 200) ?? "",
      disciplina: str(parsed.disciplina, 200) ?? "",
      docente: str(parsed.docente, 150) ?? "",
      orientador: str(parsed.orientador, 150) ?? "",
      autores: str(parsed.autores, 300) ?? "",
      numerosEstudante: str(parsed.numerosEstudante, 100) ?? "",
      cidade: str(parsed.cidade, 100) ?? "",
      ano: str(parsed.ano, 10) ?? String(new Date().getFullYear()),
      mostrarLogo: Boolean(parsed.mostrarLogo),
      secoes: Array.isArray(parsed.secoes) ? parsed.secoes : [],
    };

    let logoBuffer: Buffer | null = null;
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && form.mostrarLogo) {
      if (logoFile.size > MAX_LOGO_BYTES) {
        return NextResponse.json({ error: "Logótipo demasiado grande (máx 3 MB)." }, { status: 400 });
      }
      logoBuffer = Buffer.from(await logoFile.arrayBuffer());
    }

    const secoesIA = SECOES.filter(s => s.geradaPorIA && form.secoes.includes(s.id)).map(s => s.id);

    let conteudoIA: Record<string, string> = {};
    try {
      conteudoIA = await gerarConteudoIA(form, secoesIA, apiKey);
    } catch (e) {
      await logError({ route: "/api/academico/gerar", message: "Falha na geração IA", detail: String(e), userId: user.id });
      return NextResponse.json({ error: "Erro ao gerar o conteúdo com IA. Tenta novamente." }, { status: 502 });
    }

    const docxBuffer = await construirDocx(form, conteudoIA, logoBuffer);

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="trabalho-academico.docx"`,
      },
    });
  } catch (e) {
    await logError({ route: "/api/academico/gerar", message: "Erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno ao gerar o documento." }, { status: 500 });
  }
}
