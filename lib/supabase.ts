import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para rotas de API que escrevem em tabelas públicas
 * (contacto, alertas de vagas, comunidade, pedidos de serviço).
 *
 * Usa a SERVICE_ROLE_KEY, não a chave anónima. Antes usava a anónima, o
 * que obrigava essas tabelas a ter políticas RLS de INSERT abertas
 * (`WITH CHECK (true)`) para os formulários funcionarem — e essas
 * políticas valem para QUALQUER pessoa, já que a chave anónima está
 * publicada no browser. Na prática, qualquer um podia inserir linhas
 * directamente, saltando por cima do rate limit e da validação destas
 * rotas.
 *
 * Com a chave de serviço, as rotas continuam a escrever normalmente
 * (service role ignora RLS) e as políticas abertas puderam ser
 * removidas — passa a ser impossível escrever nestas tabelas sem passar
 * por aqui.
 *
 * O `import "server-only"` acima garante que isto nunca pode ser
 * importado por um componente de cliente: se alguém tentar, o build
 * falha em vez de enviar a chave de serviço para o browser.
 */
let _client: SupabaseClient | null = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url === "your_supabase_url") {
    throw new Error("Supabase environment variables not configured. See DEPLOY.md.");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
