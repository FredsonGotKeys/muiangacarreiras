import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sbRateLimit = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Fallback em memória — só usado se a base de dados estiver indisponível,
// para uma falha transitória da BD nunca derrubar o site inteiro.
const rateLimitFallback = new Map<string, { count: number; reset: number }>();
function rateLimitEmMemoria(ip: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const entry = rateLimitFallback.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitFallback.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

/**
 * Rate limiting persistente (tabela `rate_limits` + função `rate_limit_check`
 * atómica no Postgres) — ao contrário de um Map em memória, funciona
 * correctamente entre instâncias serverless da Vercel, que não partilham
 * processo nem memória entre pedidos.
 */
export async function rateLimit(ip: string, maxPerMinute = 10): Promise<boolean> {
  const { data, error } = await sbRateLimit.rpc("rate_limit_check", {
    p_chave: ip,
    p_max: maxPerMinute,
    p_janela_seg: 60,
  });
  if (error) {
    console.error("rate_limit_check falhou, a usar fallback em memória:", error.message);
    return rateLimitEmMemoria(ip, maxPerMinute);
  }
  return Boolean(data);
}

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ── Validação de string: trim, comprimento máximo, não vazio
export function str(val: unknown, max = 500): string | null {
  if (typeof val !== "string") return null;
  const s = val.trim();
  if (!s || s.length > max) return null;
  return s;
}

export function email(val: unknown): string | null {
  const s = str(val, 254);
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

export function rateLimitedResponse() {
  return NextResponse.json(
    { error: "Demasiados pedidos. Tenta novamente em 1 minuto." },
    { status: 429 }
  );
}

export function validationError(msg = "Dados inválidos.") {
  return NextResponse.json({ error: msg }, { status: 400 });
}
