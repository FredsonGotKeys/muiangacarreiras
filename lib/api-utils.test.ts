import { describe, it, expect } from "vitest";
import { str, email } from "./api-utils";

describe("str", () => {
  it("rejeita valores não-string", () => {
    expect(str(123)).toBeNull();
    expect(str(null)).toBeNull();
    expect(str(undefined)).toBeNull();
    expect(str({})).toBeNull();
  });

  it("apara espaços e rejeita string vazia", () => {
    expect(str("   ")).toBeNull();
    expect(str("  ola  ")).toBe("ola");
  });

  it("rejeita strings acima do limite máximo", () => {
    expect(str("a".repeat(10), 5)).toBeNull();
    expect(str("a".repeat(5), 5)).toBe("aaaaa");
  });
});

describe("email", () => {
  it("aceita emails válidos", () => {
    expect(email("fredson@exemplo.co.mz")).toBe("fredson@exemplo.co.mz");
  });

  it("rejeita formatos inválidos", () => {
    expect(email("nao-e-email")).toBeNull();
    expect(email("falta@dominio")).toBeNull();
    expect(email("@semlocal.com")).toBeNull();
    expect(email(42)).toBeNull();
  });

  it("rejeita emails acima de 254 caracteres", () => {
    const longo = "a".repeat(250) + "@a.co";
    expect(email(longo)).toBeNull();
  });
});
