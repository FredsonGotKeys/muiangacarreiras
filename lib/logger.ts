import { createClient } from "@supabase/supabase-js";

/**
 * Logging persistente de erros (tabela error_logs no Supabase).
 * Nunca lança — uma falha de logging não deve derrubar o pedido original.
 * Uso: await logError({ route: "/api/remove-bg", message: "...", detail: {...} });
 */
let _client: ReturnType<typeof createClient> | null = null;
function client() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}

export async function logError(entry: {
  route: string;
  message: string;
  level?: "error" | "warn" | "info";
  detail?: unknown;
  userId?: string;
  ip?: string;
  statusCode?: number;
}) {
  // Sempre log no console — o registo persistente é um extra, nunca uma dependência
  console.error(`[${entry.route}] ${entry.message}`, entry.detail ?? "");

  const sb = client();
  if (!sb) return;
  try {
    // Sem tipos gerados do Supabase, o insert infere `never[]` — cast pontual necessário
    await (sb.from("error_logs") as unknown as { insert: (row: Record<string, unknown>) => Promise<unknown> }).insert({
      route: entry.route,
      level: entry.level ?? "error",
      message: entry.message,
      detail: entry.detail ? JSON.parse(JSON.stringify(entry.detail)) : null,
      user_id: entry.userId ?? null,
      ip: entry.ip ?? null,
      status_code: entry.statusCode ?? null,
    });
  } catch {
    // Não propagar — logging nunca deve quebrar o fluxo principal
  }
}
