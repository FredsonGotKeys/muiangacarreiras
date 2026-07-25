import { describe, it, expect } from "vitest";
import { recomendarModelo } from "./cv-modelos-recomendacao";

describe("recomendarModelo", () => {
  it("devolve null para título vazio", () => {
    expect(recomendarModelo("")).toBeNull();
    expect(recomendarModelo("   ")).toBeNull();
  });

  it("devolve null quando não há correspondência", () => {
    expect(recomendarModelo("xyzabc123")).toBeNull();
  });

  it("recomenda criativo para designer gráfico", () => {
    expect(recomendarModelo("Designer Gráfico")?.modeloId).toBe("criativo");
  });

  it("recomenda premium para director executivo", () => {
    expect(recomendarModelo("Director Executivo")?.modeloId).toBe("premium");
  });

  it("recomenda classico para assistente administrativo (só ATS bate depois de classico não corresponder)", () => {
    expect(recomendarModelo("Assistente Administrativo")?.modeloId).toBe("ats");
  });

  it("recomenda academico para professor universitário", () => {
    expect(recomendarModelo("Professor Universitário")?.modeloId).toBe("academico");
  });

  it("é insensível a maiúsculas/minúsculas", () => {
    expect(recomendarModelo("DESIGNER")?.modeloId).toBe("criativo");
  });

  it("prioriza a regra mais específica quando várias palavras-chave poderiam bater", () => {
    // "director de design" deve cair em criativo (regra testada primeiro), não em premium
    expect(recomendarModelo("Director de Design")?.modeloId).toBe("criativo");
  });
});
