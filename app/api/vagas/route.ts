import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

const BASE = "https://njobs.co.mz";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Cache 1 hora — evita sobrecarga no njobs
export const revalidate = 3600;

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Converte DD/MM/YYYY → "18 Jun 2026" para exibir
function formatDate(raw: string): string {
  const [d, m, y] = raw.split("/");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const mi = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${months[mi] ?? m} ${y}`;
}

// Devolve dias restantes ou null se já expirou
function daysLeft(raw: string): number | null {
  const [d, m, y] = raw.split("/").map(Number);
  const expiry = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  return diff;
}

interface VagaDetail {
  title: string;
  empresa: string;
  local: string;
  categoria: string;
  prazoRaw: string;   // DD/MM/YYYY
  prazoLabel: string; // "18 Jun 2026"
  diasRestantes: number | null;
  status: "Aberto" | "Encerrado";
  url: string;
  slug: string;
}

async function scrapeDetail(url: string, slug: string): Promise<VagaDetail | null> {
  try {
    const html = await fetchHtml(url);
    const root = parse(html);

    // Título — h1 da página
    const title =
      root.querySelector("h1.entry-title")?.text.trim() ||
      root.querySelector("h1")?.text.trim() ||
      slug.replace(/-\d+$/, "").replace(/-/g, " ");

    // Empresa — texto alternativo da logo ou texto próximo
    const logoAlt = root.querySelector('img[src*="uploads"]')?.getAttribute("alt")?.trim();
    const empresa = logoAlt || "Empresa parceira";

    // Localização — link com parâmetro local=
    const local =
      root.querySelector('a[href*="local="]')?.text.trim() || "Moçambique";

    // Categoria — link com parâmetro categoria=
    const categoriaLinks = root.querySelectorAll('a[href*="categoria="]');
    const categoria = categoriaLinks.map(a => a.text.trim()).filter(Boolean).join(", ") || "Geral";

    // Data de Expiração — procura padrão DD/MM/YYYY no texto da página
    const fullText = root.text;
    const dateMatch = fullText.match(/Data de Expira[çc][aã]o[:\s]+(\d{2}\/\d{2}\/\d{4})/i)
      || fullText.match(/(\d{2}\/\d{2}\/\d{4})/);

    const prazoRaw = dateMatch ? dateMatch[1] : "";
    const prazoLabel = prazoRaw ? formatDate(prazoRaw) : "Indefinida";
    const diasRestantes = prazoRaw ? daysLeft(prazoRaw) : null;
    const status: "Aberto" | "Encerrado" =
      diasRestantes !== null && diasRestantes < 0 ? "Encerrado" : "Aberto";

    return { title, empresa, local, categoria, prazoRaw, prazoLabel, diasRestantes, status, url, slug };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // 1. Buscar página de listagem
    const html = await fetchHtml(`${BASE}/vagas-de-emprego/`);
    const root = parse(html);

    // 2. Extrair links únicos de /vaga/
    const seen = new Set<string>();
    const slugs: { slug: string; url: string }[] = [];

    root.querySelectorAll("h3 a").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      const m = href.match(/\/vaga\/([^/]+)\//);
      if (!m) return;
      const slug = m[1];
      if (seen.has(slug)) return;
      seen.add(slug);
      const url = href.startsWith("http") ? href : `${BASE}${href}`;
      slugs.push({ slug, url });
    });

    // Limitar às 16 mais recentes
    const topSlugs = slugs.slice(0, 16);

    // 3. Buscar detalhes em lotes de 4 para não sobrecarregar njobs
    const results: (VagaDetail | null)[] = [];
    for (let i = 0; i < topSlugs.length; i += 4) {
      const batch = topSlugs.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(({ slug, url }) => scrapeDetail(url, slug))
      );
      results.push(...batchResults);
    }

    const vagas: VagaDetail[] = results
      .filter((v): v is VagaDetail => v !== null)
      .filter((v) => v.status === "Aberto"); // mostrar só vagas abertas

    return NextResponse.json({
      vagas,
      total: vagas.length,
      fonte: "njobs.co.mz",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { vagas: [], total: 0, error: msg },
      { status: 500 }
    );
  }
}
