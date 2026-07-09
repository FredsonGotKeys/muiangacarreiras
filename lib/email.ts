import { logError } from "@/lib/logger";

/**
 * Envio de emails transaccionais via Resend (REST API directa, sem SDK —
 * mantém o projecto leve). Nunca lança — se RESEND_API_KEY não estiver
 * configurada, regista aviso e continua (o fluxo principal nunca deve
 * falhar por causa de um email).
 */
const FROM = process.env.RESEND_FROM_EMAIL ?? "MUIANGA Carreiras <onboarding@resend.dev>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY não configurada — email para ${params.to} não enviado ("${params.subject}")`);
    return false;
  }
  if (!params.to) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: FROM, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      await logError({ route: "lib/email", message: "Resend respondeu erro", detail: body, statusCode: res.status });
      return false;
    }
    return true;
  } catch (e) {
    await logError({ route: "lib/email", message: "Falha ao enviar email", detail: String(e) });
    return false;
  }
}

/** Endereço para onde vão as notificações internas (novo pedido, nova candidatura, etc.) */
export function adminEmail(): string | null {
  return process.env.ADMIN_NOTIFY_EMAIL ?? null;
}

/**
 * Escapa entidades HTML — todo texto de origem do utilizador (nome, mensagem,
 * descrição, etc.) tem de passar por aqui antes de entrar num template de
 * email. Sem isto, um "<img src=x onerror=...>" numa mensagem de contacto
 * chegaria tal e qual ao HTML do email do admin.
 */
function esc(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const WRAP = (title: string, body: string) => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#faf9f6">
  <p style="color:#C9A84C;font-weight:bold;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">MUIANGA CARREIRAS</p>
  <h1 style="font-size:20px;color:#0D0D0D;margin:0 0 16px">${esc(title)}</h1>
  <div style="color:#444;font-size:14px;line-height:1.6">${body}</div>
  <p style="color:#999;font-size:11px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">MUIANGA Carreiras — Maputo, Moçambique</p>
</div>`;

export const templates = {
  subscricaoActiva: (nome: string, diasValidos = 30) => WRAP(
    "Acesso activado!",
    `<p>Olá ${esc(nome) || "candidato"},</p><p>A tua subscrição está activa — tens acesso completo às vagas por ${diasValidos} dias.</p><p><strong>Boa sorte na procura!</strong></p>`
  ),
  candidaturaRecebida: (nome: string, vaga: string) => WRAP(
    "Candidatura recebida",
    `<p>Olá ${esc(nome) || "candidato"},</p><p>A tua candidatura para <strong>${esc(vaga)}</strong> foi recebida com sucesso. Vamos encaminhá-la e aguardamos feedback da empresa.</p>`
  ),
  pedidoServicoRecebido: (nome: string, servico: string) => WRAP(
    "Pedido recebido",
    `<p>Olá ${esc(nome) || ""},</p><p>Recebemos o teu pedido de <strong>${esc(servico)}</strong>. A nossa equipa entra em contacto em breve.</p>`
  ),
  novaVagaAlerta: (titulo: string, empresa: string, url: string) => WRAP(
    "Nova vaga para ti",
    `<p><strong>${esc(titulo)}</strong> — ${esc(empresa)}</p><p><a href="${esc(url)}" style="color:#C9A84C">Ver vaga →</a></p>`
  ),
  adminNotificacao: (assunto: string, detalhe: string) => WRAP(
    assunto,
    `<pre style="white-space:pre-wrap;font-family:monospace;font-size:12px;background:#fff;padding:12px;border-radius:8px;border:1px solid #eee">${esc(detalhe)}</pre>`
  ),
};
