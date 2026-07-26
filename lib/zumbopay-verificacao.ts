export const ZUMBOPAY_API_URL = "https://zumbopay.com/api/public/v1";

export type Verificacao =
  | { ok: true; dados: Record<string, unknown>; fonte: "api" | "payload" }
  | { ok: false; status: number; detalhe: unknown };

/**
 * Re-verificação do pagamento antes de activar o acesso.
 *
 * A ZumboPay só expõe `GET /payments/{ref}` para LINKS de pagamento
 * (referências `ZP-LNK-...`). Uma cobrança STK push — o único método que
 * este site usa (M-Pesa/e-Mola) — tem referência `ZUMBO...` e devolve
 * sempre 404 "Payment request not found"; não existe endpoint público
 * para a consultar (sondados `/charges/{ref}`, `/transactions`,
 * `/payment/{ref}`, `/charge/{ref}`: todos inexistentes).
 *
 * A versão anterior tratava esse 404 como falha fatal, o que significava
 * que NENHUM pagamento por M-Pesa/e-Mola poderia alguma vez ser
 * confirmado — o webhook devolvia 502 e a compra ficava eternamente
 * pendente. Como nunca tinha sido feito um pagamento real, o defeito
 * nunca se manifestou.
 *
 * Regra actual, sem abrir mão da segurança:
 *  - Endpoint conhece a referência → a resposta dele manda (fonte
 *    independente, o ideal).
 *  - 404 → usa-se o payload do webhook, que a esta altura já passou por
 *    HMAC SHA-256, janela de frescura e idempotência, e continua sujeito
 *    ao cross-check de valor e ao guard do PIN e-Mola.
 *  - Qualquer outro erro (500, rede, JSON inválido) → "não consegui
 *    verificar": o evento NÃO é processado e a ZumboPay volta a tentar.
 */
export async function verificarPagamento(
  reference: string,
  apiKey: string,
  payloadData: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<Verificacao> {
  try {
    const res = await fetchImpl(`${ZUMBOPAY_API_URL}/payments/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      const dados = (body?.data ?? body?.payment) as Record<string, unknown> | undefined;
      if (dados) return { ok: true, dados, fonte: "api" };
      return { ok: false, status: res.status, detalhe: { motivo: "resposta_sem_dados", body } };
    }

    if (res.status === 404) {
      return { ok: true, dados: payloadData, fonte: "payload" };
    }

    const texto = await res.text().catch(() => "");
    return { ok: false, status: res.status, detalhe: { motivo: "http_inesperado", body: texto.slice(0, 300) } };
  } catch (e) {
    return { ok: false, status: 0, detalhe: { motivo: "erro_rede", erro: String(e) } };
  }
}
