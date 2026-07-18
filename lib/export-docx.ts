"use client";

/**
 * Gera um ficheiro Word (.docx) a partir dos dados do CV — client-side,
 * sem passar pelo servidor. Estrutura simples e fiel ao conteúdo do CV,
 * compatível com qualquer versão do Word.
 */
interface CvDataLike {
  nome: string; titulo: string; telefone: string; email: string;
  endereco: string; cidade: string; objectivo: string;
  formacao: { instituicao: string; curso: string; grau: string; anoInicio: string; anoFim: string; descricao: string }[];
  experiencia: { empresa: string; cargo: string; local: string; dataInicio: string; dataFim: string; actualmente: boolean; descricao: string }[];
  competenciasTecnicas: string[];
  competenciasInformaticas: string[];
  linguas: { lingua: string; nivel: string }[];
}

export async function gerarCvDocx(data: CvDataLike, accentColorHex = "C9A84C"): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: data.nome || "Currículo", bold: true })],
    })
  );
  if (data.titulo) {
    children.push(new Paragraph({ children: [new TextRun({ text: data.titulo, color: accentColorHex, bold: true })] }));
  }

  const contacto = [data.telefone, data.email, data.endereco, data.cidade].filter(Boolean).join("  ·  ");
  if (contacto) {
    children.push(new Paragraph({ children: [new TextRun({ text: contacto, size: 20, color: "666666" })], spacing: { after: 240 } }));
  }

  if (data.objectivo) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "PERFIL PROFISSIONAL", color: accentColorHex })] }));
    children.push(new Paragraph({ children: [new TextRun(data.objectivo)], spacing: { after: 200 } }));
  }

  if (data.experiencia?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "EXPERIÊNCIA PROFISSIONAL", color: accentColorHex })] }));
    data.experiencia.forEach(e => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${e.cargo} — ${e.empresa}`, bold: true })] }));
      const periodo = `${e.dataInicio} - ${e.actualmente ? "Actual" : e.dataFim}${e.local ? " · " + e.local : ""}`;
      children.push(new Paragraph({ children: [new TextRun({ text: periodo, italics: true, size: 20, color: "888888" })] }));
      if (e.descricao) children.push(new Paragraph({ children: [new TextRun(e.descricao)], spacing: { after: 160 } }));
    });
  }

  if (data.formacao?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "FORMAÇÃO ACADÉMICA", color: accentColorHex })] }));
    data.formacao.forEach(f => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${f.grau} em ${f.curso}`, bold: true })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${f.instituicao} · ${f.anoInicio}-${f.anoFim}`, italics: true, size: 20, color: "888888" })], spacing: { after: 160 } }));
    });
  }

  const skills = [...(data.competenciasTecnicas ?? []), ...(data.competenciasInformaticas ?? [])];
  if (skills.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "COMPETÊNCIAS", color: accentColorHex })] }));
    children.push(new Paragraph({ children: [new TextRun(skills.join(" · "))], spacing: { after: 200 } }));
  }

  if (data.linguas?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "IDIOMAS", color: accentColorHex })] }));
    children.push(new Paragraph({ children: [new TextRun(data.linguas.map(l => `${l.lingua} (${l.nivel})`).join(" · "))] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  });

  return Packer.toBlob(doc);
}

export async function gerarTextoDocx(titulo: string, texto: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
  // Norma: Times New Roman, tamanho 12 (docx usa "half-points" — 24 = 12pt).
  const FONTE = "Times New Roman";
  const TAMANHO = 24;
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: titulo, font: FONTE, size: TAMANHO, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
        ...texto.split("\n").map(line => new Paragraph({ children: [new TextRun({ text: line, font: FONTE, size: TAMANHO })] })),
      ],
    }],
    styles: { default: { document: { run: { font: FONTE, size: TAMANHO } } } },
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
