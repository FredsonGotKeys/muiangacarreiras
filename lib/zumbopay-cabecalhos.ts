import { createHmac, timingSafeEqual } from "crypto";

/**
 * Nomes de cabeçalho que a ZumboPay envia realmente — confirmados a
 * partir de entregas reais capturadas em error_logs (27 Jul 2026):
 *   x-zumbopay-signature, x-zumbopay-timestamp,
 *   x-zumbopay-event, x-zumbopay-delivery, x-zumbo-signature
 *
 * O webhook lia "x-signature"/"x-timestamp", nomes que a ZumboPay nunca
 * envia. Todas as entregas eram recusadas com "missing_signature" antes
 * sequer de se chegar à verificação da assinatura — e, como essa recusa
 * não era registada, o problema era completamente invisível.
 */
export const CABECALHOS_ASSINATURA = ["x-zumbopay-signature", "x-zumbo-signature", "x-signature"];
export const CABECALHOS_TIMESTAMP = ["x-zumbopay-timestamp", "x-zumbo-timestamp", "x-timestamp"];

/** Devolve o primeiro cabeçalho preenchido da lista (case-insensitive via Headers). */
export function lerCabecalho(headers: Headers, nomes: string[]): string {
  for (const nome of nomes) {
    const v = headers.get(nome);
    if (v) return v;
  }
  return "";
}

/**
 * Aceita as duas convenções de assinatura em uso: sobre
 * `${timestamp}.${body}` (documentada) e sobre o corpo apenas. Ambas
 * exigem o segredo partilhado, por isso não se abre mão de segurança —
 * evita-se apenas recusar pagamentos legítimos por uma diferença de
 * convenção que não controlamos.
 */
export function assinaturaValida(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string | undefined,
): boolean {
  if (!secret || secret.length < 16) return false;
  const sig = signature.replace(/^sha256=/i, "").trim().toLowerCase();

  const candidatos = [
    createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"),
    createHmac("sha256", secret).update(rawBody).digest("hex"),
  ];

  return candidatos.some((esperado) => {
    if (sig.length !== esperado.length) return false;
    try {
      return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(esperado, "hex"));
    } catch {
      return false;
    }
  });
}
