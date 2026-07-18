import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, getIp, str, rateLimitedResponse, validationError } from "@/lib/api-utils";
import { sendEmail, templates, adminEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 5))) return rateLimitedResponse();

  const body = await req.json().catch(() => null);
  if (!body) return validationError();

  const nome      = str(body.nome, 120);
  const contacto  = str(body.contacto, 100);
  const servico   = str(body.servico, 150);
  const orcamento = str(body.orcamento, 50);
  const descricao = str(body.descricao, 2000);

  if (!nome || !contacto || !servico)
    return validationError("Nome, contacto e serviço são obrigatórios.");

  const { error } = await getSupabase().from("service_requests").insert([{
    nome, contacto, servico,
    orcamento: orcamento ?? null,
    descricao: descricao ?? null,
    created_at: new Date().toISOString(),
  }]);

  if (error) return NextResponse.json({ error: "Erro ao guardar. Tenta novamente." }, { status: 500 });

  // "contacto" pode ser telefone ou email — só envia confirmação se parecer email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto)) {
    sendEmail({ to: contacto, subject: "Pedido recebido", html: templates.pedidoServicoRecebido(nome, servico) }).catch(() => {});
  }
  const adminTo = adminEmail();
  if (adminTo) {
    sendEmail({ to: adminTo, subject: "Novo pedido de serviço", html: templates.adminNotificacao("Novo pedido de serviço", `${nome} (${contacto}) pediu "${servico}"${orcamento ? ` — orçamento: ${orcamento}` : ""}\n\n${descricao ?? ""}`) }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
