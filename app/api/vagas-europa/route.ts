import { NextResponse } from "next/server";

type VagaEuropa = {
  id: string;
  title: string;
  empresa: string;
  categoria: string;
  zona: string;
  data: string;
  descricao: string;
  url: string;
};

let cache: { vagas: VagaEuropa[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

function extractCDATA(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : s.replace(/<[^>]+>/g, "").trim();
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function parseDescription(raw: string): { categoria: string; zona: string; data: string; descricao: string } {
  const html = decodeHtmlEntities(raw);
  const text = html.replace(/<[^>]+>/g, "\n").replace(/\n{2,}/g, "\n").trim();

  const catMatch = text.match(/Categoria:\s*(.+)/i);
  const zonaMatch = text.match(/Zona:\s*(.+)/i);
  const dataMatch = text.match(/Data:\s*(.+)/i);
  const descMatch = text.match(/Descri..o:\s*([\s\S]*?)(?:Ver Oferta|$)/i);

  return {
    categoria: catMatch?.[1]?.trim() ?? "",
    zona: zonaMatch?.[1]?.trim() ?? "",
    data: dataMatch?.[1]?.trim() ?? "",
    descricao: descMatch?.[1]?.trim().slice(0, 200) ?? "",
  };
}

async function fetchVagas(): Promise<VagaEuropa[]> {
  const res = await fetch("https://www.net-empregos.com/rssfeed.asp", {
    headers: { "Accept": "application/rss+xml, application/xml, text/xml" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const xml = new TextDecoder("iso-8859-1").decode(buffer);

  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return items.map((item, i) => {
    const titleRaw = extractTag(item, "title");
    const creatorRaw = extractTag(item, "dc:creator");
    const link = extractTag(item, "link");
    const descRaw = extractCDATA(extractTag(item, "description"));
    const parsed = parseDescription(descRaw);

    return {
      id: `eu-${i}-${Date.now()}`,
      title: extractCDATA(titleRaw),
      empresa: extractCDATA(creatorRaw),
      categoria: parsed.categoria,
      zona: parsed.zona,
      data: parsed.data,
      descricao: parsed.descricao,
      url: link,
    };
  }).filter(v => v.title && v.url);
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json({
        vagas: cache.vagas,
        total: cache.vagas.length,
        updatedAt: new Date(cache.fetchedAt).toISOString(),
        cached: true,
      });
    }

    const vagas = await fetchVagas();
    cache = { vagas, fetchedAt: Date.now() };

    return NextResponse.json({
      vagas,
      total: vagas.length,
      updatedAt: new Date().toISOString(),
      cached: false,
    });
  } catch (e) {
    console.error("Vagas Europa error:", e);
    if (cache) {
      return NextResponse.json({
        vagas: cache.vagas,
        total: cache.vagas.length,
        updatedAt: new Date(cache.fetchedAt).toISOString(),
        cached: true,
        stale: true,
      });
    }
    return NextResponse.json({ error: "Erro ao carregar vagas." }, { status: 500 });
  }
}
