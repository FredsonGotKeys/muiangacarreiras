import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, getIp, str, rateLimitedResponse, validationError } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, templates } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 5))) return rateLimitedResponse();

  // Exige utilizador autenticado
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return validationError();

  const job_id    = str(body.job_id, 200);
  const job_title = str(body.job_title, 300);
  const nome      = str(body.nome, 120);
  const contacto  = str(body.contacto, 100);
  const mensagem  = str(body.mensagem, 2000);

  if (!job_id || !nome || !contacto)
    return validationError("Dados incompletos.");

  const { error } = await getSupabase().from("candidaturas").insert([{
    user_id: user.id, job_id, job_title: job_title ?? null,
    nome, contacto, mensagem: mensagem ?? null,
    created_at: new Date().toISOString(),
  }]);

  if (error) return NextResponse.json({ error: "Erro ao guardar. Tenta novamente." }, { status: 500 });

  if (user.email) {
    sendEmail({ to: user.email, subject: "Candidatura recebida", html: templates.candidaturaRecebida(nome, job_title ?? "a vaga") }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
