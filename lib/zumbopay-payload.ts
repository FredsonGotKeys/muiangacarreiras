/**
 * Leitura do corpo do webhook da ZumboPay.
 *
 * Formato real, capturado de entregas em produção (27 Jul 2026):
 *   {
 *     "ts": 1785166215000,
 *     "event": "payment.failed",
 *     "delivery_id": "b5a2803f-c1a4-4b1f-b78f-0580f625a3eb",
 *     "data": {
 *       "amount": 199, "currency": "MZN", "method": "emola",
 *       "status": "failed", "reason": "HTTP 200", "source": "public_api",
 *       "wallet_id": "...", "provider_id": null,
 *       "customer_msisdn": "258876252006",
 *       "transaction_reference": "emola-api"
 *     }
 *   }
 *
 * A referência do pagamento vem em `transaction_reference`. O código
 * procurava só por `reference`/`payment_reference`, pelo que todas as
 * entregas eram descartadas com "missing_reference" — mesmo depois de a
 * assinatura já validar correctamente.
 *
 * Aceitam-se vários nomes de propósito: já houve duas correcções
 * seguidas por causa de nomes (cabeçalhos, e agora campos do corpo), e
 * não controlamos as convenções da ZumboPay.
 */
export function extrairReferencia(payload: Record<string, unknown>): string {
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const candidatos = [data.transaction_reference, data.reference, data.payment_reference];
  for (const c of candidatos) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

/**
 * Chave de idempotência. `delivery_id` identifica a entrega e é o valor
 * mais fiável; os restantes são alternativas, e o último recurso é uma
 * chave composta, que pelo menos impede reprocessar o mesmo evento para
 * a mesma referência.
 */
export function extrairEventId(
  payload: Record<string, unknown>,
  cabecalhoDelivery: string | null,
  evento: string,
  referencia: string,
): string {
  const candidatos = [payload.delivery_id, payload.id, payload.event_id, cabecalhoDelivery];
  for (const c of candidatos) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return `${evento}:${referencia}`;
}

/** Nome do evento, do corpo ou do cabeçalho, sempre em minúsculas. */
export function extrairEvento(payload: Record<string, unknown>, cabecalhoEvento: string | null): string {
  const candidatos = [payload.event, payload.type, cabecalhoEvento];
  for (const c of candidatos) {
    if (typeof c === "string" && c.trim()) return c.trim().toLowerCase();
  }
  return "";
}
