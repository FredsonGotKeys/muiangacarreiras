/**
 * URL base pública do site — fonte única para metadados (OpenGraph,
 * canonical), sitemap.xml, robots.txt, dados estruturados e links dentro
 * de emails.
 *
 * Antes, sete ficheiros tinham "https://muiangaconsultores.co.mz" escrito
 * à mão — um domínio que **não resolve**. Isso significava previews de
 * partilha partidos, sitemap a apontar para o vazio e dados estruturados
 * inválidos para o Google.
 *
 * A leitura é defensiva de propósito: só aceita NEXT_PUBLIC_SITE_URL se
 * for mesmo um URL público (https). Em desenvolvimento essa variável vale
 * "http://localhost:3001", e se esse valor for parar por engano às
 * variáveis de produção (aconteceu ao importar o .env para o Vercel), os
 * metadados continuariam correctos em vez de anunciarem localhost ao
 * mundo.
 *
 * Quando o domínio próprio ficar activo, basta pôr NEXT_PUBLIC_SITE_URL
 * no Vercel — não é preciso mexer em código.
 */
const DOMINIO_PRODUCAO = "https://muiangacarreiras.vercel.app";

function resolverSiteUrl(): string {
  const doEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (doEnv && /^https:\/\/[^/\s]+/i.test(doEnv)) return doEnv.replace(/\/+$/, "");
  return DOMINIO_PRODUCAO;
}

export const SITE_URL = resolverSiteUrl();

/** Domínio sem protocolo — para texto corrido (ex.: termos de uso). */
export const SITE_DOMINIO = SITE_URL.replace(/^https?:\/\//, "");
