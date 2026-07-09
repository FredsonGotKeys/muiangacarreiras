import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, templates } from "@/lib/email";

/**
 * Cron diário — compara vagas actuais com os alertas subscritos e envia
 * email para as que combinam (por palavra-chave, já que não há CV persistido).
 * Protegido por CRON_SECRET — chamado pelo Vercel Cron (ver vercel.json)
 * ou por qualquer scheduler externo (cron-job.org, GitHub Actions, etc.).
 */
export const maxDuration = 60;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface VagaDetail {
  title: string; empresa: string; local: string; categoria: string; slug: string; url: string;
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sem secret configurado, o endpoint fica sempre bloqueado
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const vagasRes = await fetch(`${siteUrl}/api/vagas`, { cache: "no-store" }).catch(() => null);
  if (!vagasRes?.ok) return NextResponse.json({ error: "Falha ao obter vagas." }, { status: 502 });
  const { vagas } = (await vagasRes.json()) as { vagas: VagaDetail[] };

  const { data: alertas } = await sb.from("alertas_vagas").select("id, email, palavras_chave");
  if (!alertas?.length) return NextResponse.json({ ok: true, alertas: 0, enviados: 0 });

  let enviados = 0;

  for (const alerta of alertas as { id: string; email: string; palavras_chave: string }[]) {
    const termos = alerta.palavras_chave.toLowerCase().split(/[,;]+/).map(t => t.trim()).filter(Boolean);
    if (!termos.length) continue;

    const matches = vagas.filter(v => {
      const alvo = `${v.title} ${v.categoria} ${v.local}`.toLowerCase();
      return termos.some(t => alvo.includes(t));
    });
    if (!matches.length) continue;

    for (const vaga of matches) {
      // Idempotência — não reenviar a mesma vaga ao mesmo alerta
      const { data: jaEnviado } = await sb
        .from("alertas_vagas_enviados")
        .select("id")
        .eq("alerta_id", alerta.id)
        .eq("vaga_slug", vaga.slug)
        .maybeSingle();
      if (jaEnviado) continue;

      const ok = await sendEmail({
        to: alerta.email,
        subject: `Nova vaga: ${vaga.title}`,
        html: templates.novaVagaAlerta(vaga.title, vaga.empresa, vaga.url),
      });
      if (ok) {
        await sb.from("alertas_vagas_enviados").insert({ alerta_id: alerta.id, vaga_slug: vaga.slug });
        enviados++;
      }
    }
  }

  return NextResponse.json({ ok: true, alertas: alertas.length, enviados });
}
