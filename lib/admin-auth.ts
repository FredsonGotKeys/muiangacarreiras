import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/** Comparação em tempo constante — evita timing attack na password do admin. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isAdminAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin_session")?.value;
  return cookie === process.env.ADMIN_SESSION_TOKEN;
}
