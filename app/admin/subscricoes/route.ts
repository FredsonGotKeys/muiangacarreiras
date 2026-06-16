import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { rateLimit, getIp } from "@/lib/api-utils";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdminAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin_session")?.value;
  return cookie === process.env.ADMIN_SESSION_TOKEN;
}

// GET — listar subscrições
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { data } = await sb
    .from("subscricoes")
    .select("*, perfis(nome)")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json(data ?? []);
}

// POST — aprovar, rejeitar, ou fazer login
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Login do admin
  if (body.action === "login") {
    if (!rateLimit(getIp(req), 5)) {
      return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
    }
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || body.password !== adminPassword) {
      return NextResponse.json({ error: "Credenciais incorrectas." }, { status: 401 });
    }
    const token = process.env.ADMIN_SESSION_TOKEN;
    if (!token) return NextResponse.json({ error: "Servidor mal configurado." }, { status: 500 });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    });
    return res;
  }

  // Acções (aprovar/rejeitar)
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, acao, notas } = body as { id: string; acao: "aprovar" | "rejeitar"; notas?: string };
  if (!id || !acao) return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });

  if (acao === "aprovar") {
    const inicio = new Date();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 30);
    await sb.from("subscricoes").update({
      status: "ativa",
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      aprovado_em: inicio.toISOString(),
      notas_admin: notas ?? null,
    }).eq("id", id);
  } else if (acao === "rejeitar") {
    await sb.from("subscricoes").update({
      status: "rejeitada",
      notas_admin: notas ?? null,
    }).eq("id", id);
  } else if (acao === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("admin_session");
    return res;
  }

  return NextResponse.json({ ok: true });
}
