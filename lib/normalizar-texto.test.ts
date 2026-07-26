import { describe, it, expect } from "vitest";
import { juntarLinhasPartidas } from "./normalizar-texto";

describe("juntarLinhasPartidas", () => {
  it("junta uma frase partida a meio depois de uma conjunção pendente", () => {
    const texto = "Eu, Fredson Muianga, filho de Bernardo Joel Muianga e\nde Ana Jonas Quibe, natural de Maputo, de nacionalidade moçambicana, solteiro, professor, portador do Bilhete de Identidade n.º 123.";
    expect(juntarLinhasPartidas(texto)).toBe(
      "Eu, Fredson Muianga, filho de Bernardo Joel Muianga e de Ana Jonas Quibe, natural de Maputo, de nacionalidade moçambicana, solteiro, professor, portador do Bilhete de Identidade n.º 123."
    );
  });

  it("não altera as linhas estruturais do cabeçalho", () => {
    const texto = "Exmo(a). Senhor(a)\nDirector(a) de Recursos Humanos\nEmpresa X\n\nAssunto: Candidatura ao cargo de Técnico";
    expect(juntarLinhasPartidas(texto)).toBe(texto);
  });

  it("preserva parágrafos separados por linha em branco", () => {
    const texto = "Primeiro parágrafo completo.\n\nSegundo parágrafo completo.";
    expect(juntarLinhasPartidas(texto)).toBe(texto);
  });

  it("junta apenas a linha que termina numa conjunção pendente, preserva o resto", () => {
    const texto = "venho requerer a\nVossa Excelência que se digne\nautorizar o presente pedido.";
    expect(juntarLinhasPartidas(texto)).toBe("venho requerer a Vossa Excelência que se digne\nautorizar o presente pedido.");
  });

  it("junta quebras penduradas em cadeia quando cada linha termina numa conjunção", () => {
    const texto = "Eu, João, filho de\nAntónio e\nde Maria, natural de Maputo.";
    expect(juntarLinhasPartidas(texto)).toBe("Eu, João, filho de António e de Maria, natural de Maputo.");
  });
});
