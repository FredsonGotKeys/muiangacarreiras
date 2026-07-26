import { describe, it, expect } from "vitest";
import { parseNegrito, cortarSegmentos, tamanhoSemMarcadores, negritoParaHtml, paraTextoPlano } from "./negrito";

describe("parseNegrito", () => {
  it("divide texto simples sem marcadores num único segmento não-negrito", () => {
    expect(parseNegrito("Olá mundo")).toEqual([{ texto: "Olá mundo", negrito: false }]);
  });

  it("marca como negrito o segmento entre **", () => {
    expect(parseNegrito("Eu, **Fredson Muianga**, venho requerer")).toEqual([
      { texto: "Eu, ", negrito: false },
      { texto: "Fredson Muianga", negrito: true },
      { texto: ", venho requerer", negrito: false },
    ]);
  });
});

describe("cortarSegmentos", () => {
  it("corta a meio de um segmento simples sem quebrar o negrito", () => {
    const segmentos = parseNegrito("abc**def**ghi"); // a-b-c(3) def(3 negrito) ghi(3)
    const [antes, depois] = cortarSegmentos(segmentos, 5); // corta a meio de "def"
    expect(antes).toEqual([
      { texto: "abc", negrito: false },
      { texto: "de", negrito: true },
    ]);
    expect(depois).toEqual([
      { texto: "f", negrito: true },
      { texto: "ghi", negrito: false },
    ]);
  });
});

describe("tamanhoSemMarcadores", () => {
  it("conta apenas os caracteres visíveis, sem os marcadores **", () => {
    expect(tamanhoSemMarcadores("Eu, **Fredson**, requerente")).toBe("Eu, Fredson, requerente".length);
  });
});

describe("paraTextoPlano", () => {
  it("remove os marcadores ** devolvendo texto plano", () => {
    expect(paraTextoPlano("Eu, **Fredson Muianga**, venho requerer")).toBe("Eu, Fredson Muianga, venho requerer");
  });
});

describe("negritoParaHtml", () => {
  it("converte marcadores em <strong> e escapa HTML existente", () => {
    expect(negritoParaHtml("**Nome** < teste")).toBe("<strong>Nome</strong> &lt; teste");
  });
});
