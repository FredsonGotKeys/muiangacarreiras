import { describe, it, expect } from "vitest";
import { extrairReferencia, extrairEventId, extrairEvento } from "./zumbopay-payload";

/**
 * Payload copiado tal e qual de uma entrega real da ZumboPay registada
 * em produção. É o caso de teste que interessa: o código anterior
 * procurava `reference` e descartava esta entrega com
 * "missing_reference", apesar de a assinatura já validar.
 */
const ENTREGA_REAL = {
  ts: 1785166215000,
  event: "payment.failed",
  delivery_id: "b5a2803f-c1a4-4b1f-b78f-0580f625a3eb",
  data: {
    amount: 199,
    currency: "MZN",
    method: "emola",
    status: "failed",
    reason: "HTTP 200",
    source: "public_api",
    wallet_id: "56bfb693-05ef-4969-a070-d7696a84ad9a",
    provider_id: null,
    customer_msisdn: "258876252006",
    transaction_reference: "emola-api",
  },
};

describe("extrairReferencia", () => {
  it("lê transaction_reference da entrega real da ZumboPay", () => {
    expect(extrairReferencia(ENTREGA_REAL)).toBe("emola-api");
  });

  it("lê uma referência de cobrança STK", () => {
    expect(extrairReferencia({ data: { transaction_reference: "ZUMBO4CF942B18F" } })).toBe("ZUMBO4CF942B18F");
  });

  it("aceita os nomes alternativos reference e payment_reference", () => {
    expect(extrairReferencia({ data: { reference: "ABC" } })).toBe("ABC");
    expect(extrairReferencia({ data: { payment_reference: "DEF" } })).toBe("DEF");
  });

  it("aceita a referência na raiz quando não há objecto data", () => {
    expect(extrairReferencia({ transaction_reference: "GHI" })).toBe("GHI");
  });

  it("devolve vazio quando não há referência nenhuma", () => {
    expect(extrairReferencia({ data: { amount: 199 } })).toBe("");
    expect(extrairReferencia({ data: { transaction_reference: "   " } })).toBe("");
  });
});

describe("extrairEventId", () => {
  it("prefere o delivery_id do corpo", () => {
    expect(extrairEventId(ENTREGA_REAL, "do-cabecalho", "payment.failed", "emola-api"))
      .toBe("b5a2803f-c1a4-4b1f-b78f-0580f625a3eb");
  });

  it("recorre ao cabeçalho de entrega quando o corpo não traz id", () => {
    expect(extrairEventId({ data: {} }, "entrega-123", "payment.success", "ZUMBO1")).toBe("entrega-123");
  });

  it("constrói uma chave composta como último recurso", () => {
    expect(extrairEventId({ data: {} }, null, "payment.success", "ZUMBO1")).toBe("payment.success:ZUMBO1");
  });
});

describe("extrairEvento", () => {
  it("lê o evento do corpo, em minúsculas", () => {
    expect(extrairEvento({ event: "Payment.Success" }, null)).toBe("payment.success");
  });

  it("recorre ao cabeçalho quando o corpo não traz evento", () => {
    expect(extrairEvento({}, "payment.failed")).toBe("payment.failed");
  });
});
