import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str } from "@/lib/api-utils";

/**
 * Gera texto de Requerimento de Pedido de Emprego seguindo o modelo formal
 * moçambicano. Não usa IA — é um template determinístico preenchido com
 * os dados já existentes no CV. Zero custo de API, zero risco de alucinação.
 */
function formatDate(d: Date): string {
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 12)) return rateLimitedResponse();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.cvData) return NextResponse.json({ error: "Dados do CV em falta." }, { status: 400 });

  const cv = body.cvData as Record<string, unknown>;
  const nome = str(cv.nome, 120) ?? "";
  const biDire = str(cv.biDire, 60) ?? "";
  const nacionalidade = str(cv.nacionalidade, 60) ?? "Moçambicana";
  const endereco = str(cv.endereco, 200) ?? "";
  const cidade = str(cv.cidade, 100) ?? "Maputo";
  const telefone = str(cv.telefone, 60) ?? "";
  const email = str(cv.email, 200) ?? "";

  const empresa = str(body.empresa, 200) ?? "___________________________";
  const cargo = str(body.cargo, 200) ?? "___________________________";
  const cidadeData = str(body.cidadeData, 100) ?? cidade;

  if (!nome) {
    return NextResponse.json({ error: "Preenche pelo menos o nome no CV antes de gerar o requerimento." }, { status: 400 });
  }

  const hoje = formatDate(new Date());

  const requerimento = `Exmo(a). Senhor(a)
Director(a) de Recursos Humanos
${empresa}

Assunto: Requerimento de Emprego — Candidatura ao cargo de ${cargo}

Eu, ${nome}${biDire ? `, portador(a) do Bilhete de Identidade/DIRE n.º ${biDire}` : ""}, de nacionalidade ${nacionalidade}${endereco ? `, residente em ${endereco}, ${cidade}` : `, residente em ${cidade}`}, venho por este meio requerer a Vossa Excelência que se digne considerar a minha candidatura ao cargo de ${cargo} nessa instituição.

Anexo à presente o meu Curriculum Vitae detalhado, bem como a Carta de Apresentação, para vossa apreciação.

Coloco-me à inteira disposição de Vossa Excelência para prestar quaisquer esclarecimentos adicionais que considerem necessários, podendo ser contactado(a) através do telefone ${telefone || "___________"} ou do email ${email || "___________"}.

Sem outro assunto de momento, subscrevo-me com elevada estima e consideração.

${cidadeData}, ${hoje}

_____________________________________
${nome}`;

  return NextResponse.json({ requerimento });
}
