import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, getIp, str, email, rateLimitedResponse, validationError } from "@/lib/api-utils";
import { sendEmail, templates, adminEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 5))) return rateLimitedResponse();

  const body = await req.json().catch(() => null);
  if (!body) return validationError();

  const nome      = str(body.nome, 120);
  const emailVal  = email(body.email);
  const tel       = str(body.tel, 30);
  const area      = str(body.area, 100);
  const pais      = str(body.pais, 60);
  const motivacao = str(body.motivacao, 1000);

  if (!nome || !emailVal || !area || !pais)
    return validationError("Nome, email, área e país são obrigatórios.");

  const { error } = await getSupabase().from("community_members").insert([{
    nome, email: emailVal, tel: tel ?? null, area, pais,
    motivacao: motivacao ?? null,
    created_at: new Date().toISOString(),
  }]);

  if (error) return NextResponse.json({ error: "Erro ao guardar. Tenta novamente." }, { status: 500 });

  sendEmail({ to: emailVal, subject: "Pedido de adesão recebido", html: templates.pedidoServicoRecebido(nome, "adesão à Comunidade MUIANGA") }).catch(() => {});
  const adminTo = adminEmail();
  if (adminTo) {
    sendEmail({ to: adminTo, subject: "Novo pedido de adesão à comunidade", html: templates.adminNotificacao("Novo membro da comunidade", `${nome} (${emailVal}) — ${area}, ${pais}`) }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
