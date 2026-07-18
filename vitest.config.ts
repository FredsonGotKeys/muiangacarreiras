import { defineConfig } from "vitest/config";

// Alguns módulos (lib/api-utils.ts, lib/pricing.ts) criam um cliente
// Supabase à importação. Nos testes isso nunca liga à rede a sério — só
// precisa de valores com formato válido para o construtor não rebentar.
export default defineConfig({
  test: {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
