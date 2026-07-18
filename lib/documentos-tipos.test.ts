import { describe, it, expect } from "vitest";
import { TIPOS_DOCUMENTO, CATEGORIAS, getTipoDocumento } from "./documentos-tipos";

/**
 * Estas regras existem porque um slug duplicado ou desalinhado com a
 * constraint `documentos_gerados_tipo_check` na base de dados falha
 * silenciosamente em produção (o INSERT do documento é rejeitado, mas o
 * download já aconteceu — o utilizador nem repara). Já apanhei este tipo de
 * bug manualmente uma vez nesta sessão; isto automatiza essa verificação.
 */
describe("catálogo de documentos", () => {
  it("não tem slugs duplicados", () => {
    const slugs = TIPOS_DOCUMENTO.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada tipo pertence a uma categoria válida", () => {
    const idsValidos = new Set(CATEGORIAS.map((c) => c.id));
    for (const tipo of TIPOS_DOCUMENTO) {
      expect(idsValidos.has(tipo.categoria)).toBe(true);
    }
  });

  it("o servicoSlug de cada tipo corresponde ao da sua categoria", () => {
    const servicoPorCategoria = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.servicoSlug]));
    for (const tipo of TIPOS_DOCUMENTO) {
      expect(tipo.servicoSlug).toBe(servicoPorCategoria[tipo.categoria]);
    }
  });

  it("tipos que exigem entidade têm labelEntidade definido", () => {
    for (const tipo of TIPOS_DOCUMENTO) {
      if (tipo.precisaEntidade) expect(tipo.labelEntidade).toBeTruthy();
    }
  });

  it("getTipoDocumento encontra um tipo existente e devolve undefined para um slug inválido", () => {
    expect(getTipoDocumento("declaracao-residencia")?.titulo).toBe("Declaração de Residência");
    expect(getTipoDocumento("isto-nao-existe")).toBeUndefined();
  });
});
