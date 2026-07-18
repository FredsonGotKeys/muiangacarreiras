import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitedResponse, str, email as emailV } from "@/lib/api-utils";
import { sendEmail, templates, adminEmail } from "@/lib/email";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MAX_BYTES = 5 * 1024 * 1024;

/** PDF começa sempre por "%PDF-" (0x25 50 44 46 2D). Valida magic bytes em vez de extensão. */
function isPdfMagic(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d    // -
  );
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(getIp(req), 3))) return rateLimitedResponse();

  try {
    const formData = await req.formData();
    const nome = str(formData.get("nome"), 120);
    const email = emailV(formData.get("email"));
    const vagaTitulo = str(formData.get("vagaTitulo"), 300);
    const vagaEmpresa = str(formData.get("vagaEmpresa"), 200);
    const vagaZona = str(formData.get("vagaZona"), 100);
    const vagaUrl = str(formData.get("vagaUrl"), 1000);
    const cv = formData.get("cv") as File | null;

    if (!nome || !email || !vagaTitulo || !cv) {
      return NextResponse.json({ error: "Preenche todos os campos e anexa o CV." }, { status: 400 });
    }
    if (cv.size > MAX_BYTES) {
      return NextResponse.json({ error: "O CV deve ter no máximo 5 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await cv.arrayBuffer());
    if (!isPdfMagic(buffer)) {
      return NextResponse.json({ error: "O ficheiro não é um PDF válido." }, { status: 400 });
    }

    const safeName = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60);
    const fileName = `europa/${Date.now()}-${safeName}.pdf`;

    const { error: uploadErr } = await sb.storage
      .from("cvs")
      .upload(fileName, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadErr) {
      return NextResponse.json({ error: "Erro ao guardar CV." }, { status: 500 });
    }

    // Guardar o path (não URL pública) — admin gera signed URL on-demand
    const { error: insertErr } = await sb.from("candidaturas_europa").insert({
      nome,
      email,
      vaga_titulo: vagaTitulo,
      vaga_empresa: vagaEmpresa,
      vaga_zona: vagaZona,
      vaga_url: vagaUrl,
      cv_url: fileName, // path interno, não URL pública
      status: "nova",
    });

    if (insertErr) {
      // Limpar ficheiro órfão
      await sb.storage.from("cvs").remove([fileName]).catch(() => {});
      return NextResponse.json({ error: "Erro ao guardar candidatura." }, { status: 500 });
    }

    sendEmail({ to: email, subject: "Candidatura recebida", html: templates.candidaturaRecebida(nome, vagaTitulo) }).catch(() => {});
    const adminTo = adminEmail();
    if (adminTo) {
      sendEmail({ to: adminTo, subject: "Nova candidatura Europa", html: templates.adminNotificacao("Nova candidatura Europa", `${nome} (${email}) candidatou-se a "${vagaTitulo}"${vagaEmpresa ? ` — ${vagaEmpresa}` : ""}`) }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
