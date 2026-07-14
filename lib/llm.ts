/**
 * Chamada de chat-completion com fallback automático: tenta a Groq primeiro
 * (motor principal do MUIANGA IA); se a Groq recusar por limite de quota
 * (429) ou erro de servidor (5xx), tenta a Cerebras com um modelo equivalente
 * antes de desistir. Mantém o site a funcionar mesmo que o tecto diário
 * gratuito da Groq seja atingido.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const CEREBRAS_MODEL = "gpt-oss-120b";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

interface ChatCompletionInput {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  jsonMode?: boolean;
}

export type ChatCompletionResult =
  | { ok: true; content: string; provider: "groq" | "cerebras" }
  | { ok: false; status: number };

async function callProvider(
  url: string,
  apiKey: string,
  model: string,
  input: ChatCompletionInput,
): Promise<{ ok: true; content: string } | { ok: false; status: number }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        messages: input.messages,
        ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return { ok: true, content };
  } catch {
    return { ok: false, status: 502 };
  }
}

export async function chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResult> {
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  if (groqKey) {
    const r = await callProvider(GROQ_URL, groqKey, GROQ_MODEL, input);
    if (r.ok) return { ok: true, content: r.content, provider: "groq" };
    // Só cai para a Cerebras em falhas de quota/servidor — um 4xx "normal"
    // (ex.: pedido mal formado) falharia da mesma forma nos dois fornecedores.
    const deveTentarReserva = r.status === 429 || r.status >= 500;
    if (!deveTentarReserva || !cerebrasKey) return { ok: false, status: r.status };
  } else if (!cerebrasKey) {
    return { ok: false, status: 500 };
  }

  if (cerebrasKey) {
    const r = await callProvider(CEREBRAS_URL, cerebrasKey, CEREBRAS_MODEL, input);
    if (r.ok) return { ok: true, content: r.content, provider: "cerebras" };
    return { ok: false, status: r.status };
  }

  return { ok: false, status: 500 };
}
