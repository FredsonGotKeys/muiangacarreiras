"use client";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * Fetch wrapper that attaches the current Supabase session as Bearer token.
 * Returns 401-style response if no session — caller should handle.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const sb = getSupabaseBrowser();
  const { data: { session } } = await sb.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
