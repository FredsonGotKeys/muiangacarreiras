import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { rateLimit, getIp } from "@/lib/api-utils";

/** Comparação em tempo constante — evita timing attack na password do admin. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdminAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin_session")?.value;
  return cookie === process.env.ADMIN_SESSION_TOKEN;
}

// GET — listar subscrições com email dos utilizadores
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: subs } = await sb
    .from("subscricoes")
    .select("*, perfis(nome, bloqueado)")
    .order("created_at", { ascending: false })
    .limit(200);

  // Buscar emails via auth admin
  const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  for (const u of users) emailMap[u.id] = u.email ?? "";

  const result = (subs ?? []).map(s => ({
    ...s,
    email: emailMap[s.user_id] ?? null,
  }));

  return NextResponse.json(result);
}

// POST — login, logout, aprovar, rejeitar, revogar, bloquear
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Login
  if (body.action === "login") {
    if (!rateLimit(getIp(req), 5)) {
      return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
    }
    if (!process.env.ADMIN_PASSWORD || typeof body.password !== "string" || !safeEqual(body.password, process.env.ADMIN_PASSWORD)) {
      return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
    }
    const token = process.env.ADMIN_SESSION_TOKEN;
    if (!token) return NextResponse.json({ error: "Servidor mal configurado." }, { status: 500 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  }

  // Logout
  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("admin_session");
    return res;
  }

  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { action, id, userId, notas } = body as {
    action: string; id?: string; userId?: string; notas?: string;
  };
  const ACOES_VALIDAS = new Set([
    "aprovar", "rejeitar", "revogar", "bloquear", "desbloquear",
    "list_candidaturas", "cand_tratada", "cand_eliminar", "cand_cv_url",
  ]);
  if (!ACOES_VALIDAS.has(action)) {
    return NextResponse.json({ error: "Acção desconhecida." }, { status: 400 });
  }

  if (action === "aprovar" && id) {
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
  }

  if (action === "rejeitar" && id) {
    await sb.from("subscricoes").update({
      status: "rejeitada",
      notas_admin: notas ?? null,
    }).eq("id", id);
  }

  if (action === "revogar" && id) {
    await sb.from("subscricoes").update({
      status: "expirada",
      notas_admin: notas ?? "Acesso revogado pelo administrador.",
    }).eq("id", id);
  }

  if (action === "bloquear" && userId) {
    await sb.from("perfis").update({ bloqueado: true }).eq("id", userId);
    // Expirar todas as subscrições do utilizador
    await sb.from("subscricoes").update({ status: "expirada" })
      .eq("user_id", userId).in("status", ["ativa", "pendente"]);
  }

  if (action === "desbloquear" && userId) {
    await sb.from("perfis").update({ bloqueado: false }).eq("id", userId);
  }

  // Candidaturas Europa
  if (action === "list_candidaturas") {
    const { data } = await sb.from("candidaturas_europa")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return NextResponse.json(data ?? []);
  }

  if (action === "cand_tratada" && id) {
    await sb.from("candidaturas_europa").update({ status: "tratada" }).eq("id", id);
  }

  if (action === "cand_eliminar" && id) {
    // Apagar também o ficheiro CV do storage, se existir
    const { data: cand } = await sb.from("candidaturas_europa").select("cv_url").eq("id", id).maybeSingle();
    const path = (cand as { cv_url: string | null } | null)?.cv_url ?? null;
    if (path && !path.startsWith("http")) {
      await sb.storage.from("cvs").remove([path]).catch(() => {});
    }
    await sb.from("candidaturas_europa").delete().eq("id", id);
  }

  // Gera signed URL temporária (5 min) para visualizar o CV
  if (action === "cand_cv_url" && id) {
    const { data: cand } = await sb.from("candidaturas_europa").select("cv_url").eq("id", id).maybeSingle();
    const path = (cand as { cv_url: string | null } | null)?.cv_url ?? null;
    if (!path) return NextResponse.json({ error: "CV não encontrado." }, { status: 404 });
    if (path.startsWith("http")) return NextResponse.json({ url: path }); // legacy
    const { data, error } = await sb.storage.from("cvs").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return NextResponse.json({ error: "Erro ao gerar URL." }, { status: 500 });
    return NextResponse.json({ url: data.signedUrl });
  }

  return NextResponse.json({ ok: true });
}
