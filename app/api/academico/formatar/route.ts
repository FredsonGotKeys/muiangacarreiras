import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

/**
 * Formatação Académica — recebe um texto já escrito pelo utilizador (sem IA
 * a gerar conteúdo) e devolve um .docx com formatação técnica normalizada:
 * Times New Roman 12pt, espaçamento 1.5, justificado, índice automático.
 * Linhas que começam por "#" tornam-se títulos (apanhados pelo índice).
 */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 6))) return rateLimitedResponse();

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
  const texto = str(body?.texto, 30000);
  const titulo = str(body?.titulo, 200) ?? "Trabalho Académico";
  if (!texto) return NextResponse.json({ error: "Cola o texto a formatar." }, { status: 400 });

  try {
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableOfContents,
    } = await import("docx");

    const FONT = "Times New Roman";
    const linhas = texto.split("\n");
    const children: InstanceType<typeof Paragraph | typeof TableOfContents>[] = [
      new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: titulo, font: FONT, bold: true })], spacing: { after: 400 } }),
      new Paragraph({ children: [new TextRun({ text: "Índice", font: FONT, bold: true, size: 28 })], spacing: { before: 200, after: 200 } }),
      new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }),
      new Paragraph({ children: [], pageBreakBefore: true }),
    ];

    for (const linha of linhas) {
      const trimmed = linha.trim();
      if (!trimmed) { children.push(new Paragraph({ children: [] })); continue; }
      if (trimmed.startsWith("# ")) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: trimmed.slice(2).toUpperCase(), font: FONT, bold: true, size: 28 })],
        }));
      } else if (trimmed.startsWith("## ")) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 160 },
          children: [new TextRun({ text: trimmed.slice(3), font: FONT, bold: true, size: 26 })],
        }));
      } else {
        children.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 200 },
          indent: { firstLine: 700 },
          children: [new TextRun({ text: trimmed, font: FONT, size: 24 })],
        }));
      }
    }

    const doc = new Document({
      styles: { default: { document: { run: { font: FONT, size: 24 } } } },
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="documento-formatado.docx"`,
      },
    });
  } catch (e) {
    await logError({ route: "/api/academico/formatar", message: "Erro ao gerar docx", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro ao formatar o documento." }, { status: 500 });
  }
}
