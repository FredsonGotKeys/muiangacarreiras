import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse } from "@/lib/api-utils";
import { chatCompletion } from "@/lib/llm";

/**
 * Analisa um CV (dados estruturados, não ficheiro) com IA e devolve pontuação
 * 0-100 por categoria + recomendações. Não inventa dados — analisa apenas
 * o que o utilizador já preencheu no formulário.
 */

interface AnaliseResult {
  pontuacaoGeral: number;
  categorias: {
    nome: string;
    pontuacao: number;
    comentario: string;
  }[];
  pontosFortes: string[];
  pontosFracos: string[];
  recomendacoes: string[];
}

const CATEGORIAS_ESPERADAS = [
  "Compatibilidade ATS",
  "Ortografia e Gramática",
  "Layout e Organização",
  "Experiência",
  "Competências",
  "Clareza e Objectividade",
];

function buildCvSummary(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Nome: ${data.nome || "(não preenchido)"}`);
  lines.push(`Título profissional: ${data.titulo || "(não preenchido)"}`);
  lines.push(`Objectivo/Resumo: ${data.objectivo || "(não preenchido)"}`);
  lines.push(`Telefone: ${data.telefone ? "preenchido" : "em falta"} | Email: ${data.email ? "preenchido" : "em falta"}`);
  lines.push(`Foto: ${data.foto ? "presente" : "ausente"}`);

  const formacao = Array.isArray(data.formacao) ? data.formacao : [];
  lines.push(`\nFORMAÇÃO (${formacao.length} entradas):`);
  formacao.forEach((f: Record<string, unknown>, i: number) => {
    lines.push(`  ${i + 1}. ${f.grau ?? ""} em ${f.curso ?? "?"} — ${f.instituicao ?? "?"} (${f.anoInicio ?? "?"}-${f.anoFim ?? "?"})`);
  });

  const experiencia = Array.isArray(data.experiencia) ? data.experiencia : [];
  lines.push(`\nEXPERIÊNCIA (${experiencia.length} entradas):`);
  experiencia.forEach((e: Record<string, unknown>, i: number) => {
    lines.push(`  ${i + 1}. ${e.cargo ?? "?"} em ${e.empresa ?? "?"} (${e.dataInicio ?? "?"}-${e.actualmente ? "actual" : e.dataFim ?? "?"})`);
    if (e.descricao) lines.push(`     Descrição: ${e.descricao}`);
  });

  const tecnicas = Array.isArray(data.competenciasTecnicas) ? data.competenciasTecnicas : [];
  const informaticas = Array.isArray(data.competenciasInformaticas) ? data.competenciasInformaticas : [];
  lines.push(`\nCOMPETÊNCIAS TÉCNICAS: ${tecnicas.join(", ") || "(nenhuma)"}`);
  lines.push(`COMPETÊNCIAS INFORMÁTICAS: ${informaticas.join(", ") || "(nenhuma)"}`);

  const linguas = Array.isArray(data.linguas) ? data.linguas : [];
  lines.push(`\nIDIOMAS: ${linguas.map((l: Record<string, unknown>) => `${l.lingua} (${l.nivel})`).join(", ") || "(nenhum)"}`);

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 6)) return rateLimitedResponse();

  // Auth obrigatória — análise consome tokens Groq
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body?.cvData || typeof body.cvData !== "object") {
      return NextResponse.json({ error: "Dados do CV em falta." }, { status: 400 });
    }

    // Cap defensivo — body.cvData não tem limite de tamanho por campo (só no cliente);
    // sem isto um payload gigante custaria tokens Groq sem limite.
    const resumo = buildCvSummary(body.cvData).slice(0, 6000);

    const systemPrompt = `És um consultor sénior de Recursos Humanos moçambicano, especialista em recrutamento e sistemas ATS (Applicant Tracking System).

Vais receber um resumo estruturado de um currículo e deves fazer uma auditoria honesta e técnica.

REGRAS ABSOLUTAS:
- Nunca inventes informação que não está no resumo.
- Baseia a pontuação apenas no que foi fornecido — campos vazios ou "(não preenchido)" devem reduzir a pontuação da categoria relevante.
- Sê específico e accionável nas recomendações (nunca genérico tipo "melhora o currículo").
- Considera o mercado de trabalho moçambicano (formalidade, expectativas de recrutadores locais).
- Categorias a avaliar, EXACTAMENTE estas 6, por esta ordem: "Compatibilidade ATS", "Ortografia e Gramática", "Layout e Organização", "Experiência", "Competências", "Clareza e Objectividade".

Responde APENAS com um JSON válido neste formato exacto, sem markdown, sem texto antes ou depois:
{
  "pontuacaoGeral": <número 0-100>,
  "categorias": [
    { "nome": "Compatibilidade ATS", "pontuacao": <0-100>, "comentario": "<1 frase curta>" },
    { "nome": "Ortografia e Gramática", "pontuacao": <0-100>, "comentario": "<1 frase curta>" },
    { "nome": "Layout e Organização", "pontuacao": <0-100>, "comentario": "<1 frase curta>" },
    { "nome": "Experiência", "pontuacao": <0-100>, "comentario": "<1 frase curta>" },
    { "nome": "Competências", "pontuacao": <0-100>, "comentario": "<1 frase curta>" },
    { "nome": "Clareza e Objectividade", "pontuacao": <0-100>, "comentario": "<1 frase curta>" }
  ],
  "pontosFortes": ["<ponto 1>", "<ponto 2>", "..."],
  "pontosFracos": ["<ponto 1>", "<ponto 2>", "..."],
  "recomendacoes": ["<recomendação accionável 1>", "<recomendação accionável 2>", "..."]
}`;

    const result = await chatCompletion({
      maxTokens: 1200,
      temperature: 0.3,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Resumo do currículo:\n\n${resumo}` },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Erro ao analisar CV." }, { status: 502 });
    }

    const raw = result.content || "{}";

    let parsed: AnaliseResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Resposta inválida da IA. Tenta novamente." }, { status: 502 });
    }

    // Validação mínima de forma — garante que o frontend não recebe lixo
    if (
      typeof parsed.pontuacaoGeral !== "number" ||
      !Array.isArray(parsed.categorias) ||
      parsed.categorias.length === 0
    ) {
      return NextResponse.json({ error: "Análise incompleta. Tenta novamente." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
