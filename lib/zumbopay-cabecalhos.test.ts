import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { lerCabecalho, assinaturaValida, CABECALHOS_ASSINATURA, CABECALHOS_TIMESTAMP } from "./zumbopay-cabecalhos";

const SEGREDO = "um-segredo-de-webhook-suficientemente-longo";
const CORPO = JSON.stringify({ event: "payment.success", data: { reference: "ZUMBO123", amount: 109 } });

/**
 * Reproduz uma entrega real da ZumboPay, com os cabeçalhos exactamente
 * como ela os envia (capturados em produção). Antes desta correcção o
 * webhook procurava "x-signature"/"x-timestamp" e recusava tudo.
 */
function cabecalhosReaisZumboPay(assinatura: string, timestamp: string) {
  return new Headers({
    "content-type": "application/json",
    "x-zumbopay-event": "payment.success",
    "x-zumbopay-delivery": "d-12345",
    "x-zumbopay-signature": assinatura,
    "x-zumbopay-timestamp": timestamp,
  });
}

describe("cabeçalhos do webhook ZumboPay", () => {
  it("encontra a assinatura nos cabeçalhos reais da ZumboPay", () => {
    const h = cabecalhosReaisZumboPay("abc123", "1785162000");
    expect(lerCabecalho(h, CABECALHOS_ASSINATURA)).toBe("abc123");
    expect(lerCabecalho(h, CABECALHOS_TIMESTAMP)).toBe("1785162000");
  });

  it("continua a aceitar o nome antigo x-zumbo-signature", () => {
    const h = new Headers({ "x-zumbo-signature": "xyz" });
    expect(lerCabecalho(h, CABECALHOS_ASSINATURA)).toBe("xyz");
  });

  it("devolve vazio quando nenhum cabeçalho de assinatura existe", () => {
    expect(lerCabecalho(new Headers({ "content-type": "application/json" }), CABECALHOS_ASSINATURA)).toBe("");
  });
});

describe("assinaturaValida", () => {
  const ts = "1785162000";

  it("aceita a convenção timestamp.corpo", () => {
    const sig = createHmac("sha256", SEGREDO).update(`${ts}.${CORPO}`).digest("hex");
    expect(assinaturaValida(CORPO, ts, sig, SEGREDO)).toBe(true);
  });

  it("aceita a convenção só-corpo", () => {
    const sig = createHmac("sha256", SEGREDO).update(CORPO).digest("hex");
    expect(assinaturaValida(CORPO, ts, sig, SEGREDO)).toBe(true);
  });

  it("aceita o prefixo sha256= e maiúsculas", () => {
    const sig = createHmac("sha256", SEGREDO).update(CORPO).digest("hex").toUpperCase();
    expect(assinaturaValida(CORPO, ts, `sha256=${sig}`, SEGREDO)).toBe(true);
  });

  it("recusa uma assinatura forjada com o segredo errado", () => {
    const sig = createHmac("sha256", "segredo-do-atacante-igualmente-longo").update(CORPO).digest("hex");
    expect(assinaturaValida(CORPO, ts, sig, SEGREDO)).toBe(false);
  });

  it("recusa se o corpo for adulterado depois de assinado", () => {
    const sig = createHmac("sha256", SEGREDO).update(CORPO).digest("hex");
    const adulterado = CORPO.replace("109", "1");
    expect(assinaturaValida(adulterado, ts, sig, SEGREDO)).toBe(false);
  });

  it("recusa quando o segredo não está configurado", () => {
    const sig = createHmac("sha256", SEGREDO).update(CORPO).digest("hex");
    expect(assinaturaValida(CORPO, ts, sig, undefined)).toBe(false);
    expect(assinaturaValida(CORPO, ts, sig, "curto")).toBe(false);
  });
});
