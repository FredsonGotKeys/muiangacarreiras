import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, getIp, str, rateLimitedResponse, validationError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5)) return rateLimitedResponse();

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
  return NextResponse.json({ ok: true });
}
