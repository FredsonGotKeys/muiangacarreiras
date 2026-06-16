import { NextResponse } from "next/server";

// ── Rate limiting em memória (por IP, reset a cada minuto)
const rateLimitMap = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, maxPerMinute = 10): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 });
    return true; // permitido
  }
  if (entry.count >= maxPerMinute) return false; // bloqueado
  entry.count++;
  return true;
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
