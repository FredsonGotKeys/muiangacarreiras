import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, getIp, str, email as emailV, rateLimitedResponse, validationError } from "@/lib/api-utils";

/**
 * Subscrição de alerta de vaga por palavra-chave (ex: "contabilidade", "TI", "Maputo").
 * Não existe perfil/CV guardado no servidor, por isso o matching é simples
 * (substring no título/categoria da vaga) em vez de correspondência de perfil completo.
 */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 5))) return rateLimitedResponse();

  const body = await req.json().catch(() => null);
  if (!body) return validationError();

  const emailVal = emailV(body.email);
  const palavrasChave = str(body.palavrasChave, 200);

  if (!emailVal || !palavrasChave) return validationError("Email e palavra-chave são obrigatórios.");

  const { error } = await getSupabase().from("alertas_vagas").insert([{
    email: emailVal,
    palavras_chave: palavrasChave,
  }]);

  if (error) return NextResponse.json({ error: "Erro ao criar alerta. Tenta novamente." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
