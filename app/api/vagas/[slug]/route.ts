import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

const BASE = "https://njobs.co.mz";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const revalidate = 3600;

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatIsoDate(iso: string): string {
  // "2026-06-21" → "21 de Junho de 2026"
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS[(m ?? 1) - 1]} de ${y}`;
}

function daysLeftIso(iso: string): number {
  const expiry = new Date(iso);
  expiry.setHours(23, 59, 59, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

// Converte texto com \n em linhas limpas, agrupa em secções por headings
function parseDescription(raw: string): { heading: string; lines: string[] }[] {
  // Descodifica escapes unicode e normaliza
  const text = raw
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  const headingPatterns = [
    /^(Descri[çc][aã]o\s+das\s+Fun[çc][oõ]es?|Responsabilidades\s+e\s+[Ff]un[çc][oõ]es?|Fun[çc][oõ]es?)$/i,
    /^(Requisitos?|Qualifica[çc][oõ]es?)$/i,
    /^(O que oferecemos|Benef[ií]cios?|Oferecemos)$/i,
    /^(Exig[eê]ncias?)$/i,
    /^(Como [Cc]andidatar-?se|Candidatura)$/i,
  ];

  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const isHeading = headingPatterns.some(p => p.test(line));
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: line, lines: [] };
    } else {
      if (!current) current = { heading: "Descrição", lines: [] };
      current.lines.push(line);
    }
  }
  if (current && current.lines.length > 0) sections.push(current);

  return sections.filter(s => s.lines.length > 0);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = `${BASE}/vaga/${slug}/`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const root = parse(html);

    // ── 1. JSON-LD (fonte mais fiável — dados estruturados do WordPress)
    let jsonLd: Record<string, unknown> | null = null;
    for (const el of root.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(el.text);
        if (parsed["@type"] === "JobPosting") { jsonLd = parsed; break; }
      } catch { /* continua */ }
    }

    // ── 2. Campos do JSON-LD
    const title: string =
      (jsonLd?.title as string) ||
      root.querySelector("h1.entry-title")?.text.trim() ||
      root.querySelector("h1")?.text.trim() ||
      slug.replace(/-\d+$/, "").replace(/-/g, " ");

    const hiring = jsonLd?.hiringOrganization as Record<string, string> | undefined;
    const empresa: string =
      hiring?.name ||
      root.querySelector('img[src*="uploads"]')?.getAttribute("alt")?.trim() ||
      "Empresa";

    const logoUrl: string | null = hiring?.logo || null;

    // Localização — JSON-LD ou link da página
    const jobLocation = jsonLd?.jobLocation as Array<{ address?: { addressLocality?: string } }> | undefined;
    const local: string =
      jobLocation?.[0]?.address?.addressLocality ||
      root.querySelector('a[href*="local="]')?.text.trim() ||
      "Moçambique";

    // Categoria
    const categorias = root.querySelectorAll('a[href*="categoria="]').map(a => a.text.trim()).filter(Boolean);
    const categoria = categorias.join(", ") || "Geral";

    // Data — JSON-LD validThrough é YYYY-MM-DD (muito mais fiável)
    const validThrough = jsonLd?.validThrough as string | undefined;
    const prazoIso = validThrough?.slice(0, 10) || ""; // "2026-06-21"
    const prazoLabel = prazoIso ? formatIsoDate(prazoIso) : "Indefinida";
    const diasRestantes = prazoIso ? daysLeftIso(prazoIso) : null;

    // Descrição limpa do JSON-LD
    const descriptionRaw = (jsonLd?.description as string) || "";
    const sections = descriptionRaw ? parseDescription(descriptionRaw) : [];

    // ── 3. Campos só disponíveis no HTML da página
    const fullText = root.text;

    const nivelMatch = fullText.match(/N[ií]vel\s+[Aa]cad[eé]mico[:\s]+([^\n\r]+)/i);
    const nivelAcademico: string | null = nivelMatch?.[1]?.trim().replace(/\s+/g, " ") || null;

    const numVagasMatch = fullText.match(/N[uú]mero\s+de\s+[Vv]agas[:\s]+(\d+)/i);
    const numVagas: number | null = numVagasMatch?.[1] ? parseInt(numVagasMatch[1]) : null;

    const tipoEmprego: string | null = (jsonLd?.employmentType as string) || null;

    // ── 4. Extrair email/link de candidatura
    // Tenta JSON-LD applicationContact
    const appContact = jsonLd?.applicationContact as Record<string, string> | undefined;
    const appEmail: string | null =
      appContact?.email ||
      (() => {
        // Procura mailto: links na página
        const mailtoEl = root.querySelector('a[href^="mailto:"]');
        if (mailtoEl) {
          const href = mailtoEl.getAttribute("href") ?? "";
          return href.replace(/^mailto:/, "").split("?")[0].trim() || null;
        }
        // Regex no texto completo
        const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        return emailMatch?.[0] || null;
      })();

    // Procura link externo de candidatura (botão "Candidatar-se" ou "Apply")
    const appLinkEl =
      root.querySelector('a[href*="candidat"]') ||
      root.querySelector('a[href*="apply"]') ||
      root.querySelector('a[href*="application"]');
    const appLinkRaw = appLinkEl?.getAttribute("href");
    const appUrl: string | null =
      appLinkRaw && !appLinkRaw.startsWith("mailto:") && appLinkRaw.startsWith("http")
        ? appLinkRaw
        : null;

    return NextResponse.json({
      slug,
      title,
      empresa,
      logoUrl,
      local,
      categoria,
      prazoIso,
      prazoLabel,
      diasRestantes,
      nivelAcademico,
      numVagas,
      tipoEmprego,
      sections,
      appEmail,
      appUrl,
      sourceUrl: url,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
