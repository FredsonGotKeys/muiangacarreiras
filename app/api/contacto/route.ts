import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, getIp, str, email, rateLimitedResponse, validationError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5)) return rateLimitedResponse();

  const body = await req.json().catch(() => null);
  if (!body) return validationError();

  const nome     = str(body.nome, 120);
  const emailVal = email(body.email);
  const assunto  = str(body.assunto, 100);
  const mensagem = str(body.mensagem, 2000);

  if (!nome || !emailVal || !assunto || !mensagem)
    return validationError("Preenche todos os campos correctamente.");

  const { error } = await getSupabase().from("contact_messages").insert([{
    nome, email: emailVal, assunto, mensagem,
    created_at: new Date().toISOString(),
  }]);

  if (error) return NextResponse.json({ error: "Erro ao guardar. Tenta novamente." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
