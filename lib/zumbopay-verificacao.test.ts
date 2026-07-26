import { describe, it, expect } from "vitest";
import { verificarPagamento } from "./zumbopay-verificacao";

/**
 * Estes testes fixam a correcção do defeito que impedia QUALQUER
 * pagamento M-Pesa/e-Mola de ser confirmado: o webhook exigia que
 * `GET /payments/{ref}` respondesse, mas esse endpoint só conhece links
 * de pagamento e devolve 404 para cobranças STK. Se alguém voltar a
 * tratar o 404 como falha, o 2.º teste apanha isso antes de chegar a
 * produção — onde só se notaria quando um cliente real pagasse e não
 * recebesse acesso.
 */
function resposta(init: { ok: boolean; status: number; json?: unknown; text?: string }) {
  return {
    ok: init.ok,
    status: init.status,
    json: async () => init.json ?? {},
    text: async () => init.text ?? "",
  } as unknown as Response;
}

const PAYLOAD = { reference: "ZUMBO123", status: "success", amount: 109, channel: "mpesa" };

describe("verificarPagamento", () => {
  it("usa a resposta da API quando o endpoint conhece a referência", async () => {
    const fake = async () => resposta({ ok: true, status: 200, json: { data: { status: "success", amount: 109 } } });
    const r = await verificarPagamento("ZP-LNK-1", "chave", PAYLOAD, fake);
    expect(r).toEqual({ ok: true, dados: { status: "success", amount: 109 }, fonte: "api" });
  });

  it("cai para o payload assinado quando a cobrança STK devolve 404", async () => {
    const fake = async () => resposta({ ok: false, status: 404, json: { error: { code: "not_found" } } });
    const r = await verificarPagamento("ZUMBO123", "chave", PAYLOAD, fake);
    expect(r).toEqual({ ok: true, dados: PAYLOAD, fonte: "payload" });
  });

  it("recusa quando a API falha com erro inesperado (não confirma às cegas)", async () => {
    const fake = async () => resposta({ ok: false, status: 500, text: "boom" });
    const r = await verificarPagamento("ZUMBO123", "chave", PAYLOAD, fake);
    expect(r.ok).toBe(false);
  });

  it("recusa quando a rede falha", async () => {
    const fake = async () => { throw new Error("sem rede"); };
    const r = await verificarPagamento("ZUMBO123", "chave", PAYLOAD, fake);
    expect(r.ok).toBe(false);
  });

  it("recusa uma resposta 200 sem dados utilizáveis", async () => {
    const fake = async () => resposta({ ok: true, status: 200, json: { algo: "inesperado" } });
    const r = await verificarPagamento("ZUMBO123", "chave", PAYLOAD, fake);
    expect(r.ok).toBe(false);
  });
});
