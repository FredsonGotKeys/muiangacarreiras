import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth}` } } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  // Rate limit primeiro — protege key paga mesmo antes de auth check
  if (!rateLimit(getIp(req), 8)) return rateLimitedResponse();

  // Auth obrigatória — endpoint custa $ por chamada
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Servidor mal configurado." }, { status: 500 });

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Imagem necessária." }, { status: 400 });

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Imagem demasiado grande (máx 5 MB)." }, { status: 400 });
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formato não suportado." }, { status: 400 });
    }

    const body = new FormData();
    body.append("image_file", file);
    body.append("size", "regular");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body,
    });

    if (!res.ok) {
      // Log server-side do motivo real — nunca exposto ao cliente
      const errBody = await res.text().catch(() => "(sem corpo)");
      await logError({ route: "/api/remove-bg", message: "remove.bg respondeu erro", detail: errBody, userId: user.id, statusCode: res.status });
      const msg =
        res.status === 402 ? "Créditos esgotados no serviço de remoção de fundo."
        : res.status === 400 ? "Não foi possível processar esta imagem. Tenta outra foto."
        : "Erro ao remover fundo. Tenta novamente.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ image: `data:image/png;base64,${base64}` });
  } catch (e) {
    await logError({ route: "/api/remove-bg", message: "erro interno", detail: String(e), userId: user.id });
    return NextResponse.json({ error: "Erro interno. Verifica a tua ligação e tenta novamente." }, { status: 500 });
  }
}
