import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.PAYSUITE_WEBHOOK_SECRET ?? "";
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let event: { event: string; data: { reference: string; status: string; id: string } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (event.event === "payment.success") {
    const reference = event.data?.reference ?? "";
    // reference: "SUB-{userId8chars}-{timestamp}"
    const match = reference.match(/^SUB-([a-f0-9-]{8})/i);
    if (!match) return NextResponse.json({ ok: true });

    const userIdPrefix = match[1];

    // Encontrar user pelo prefixo do ID
    const { data: perfis } = await sb
      .from("perfis")
      .select("id")
      .ilike("id", `${userIdPrefix}%`)
      .limit(1);

    const userId = (perfis as { id: string }[] | null)?.[0]?.id;
    if (!userId) return NextResponse.json({ ok: true });

    // Activar subscrição — 30 dias
    const inicio = new Date();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 30);

    // Cancelar qualquer subscrição pendente/expirada anterior
    await sb.from("subscricoes").update({ status: "expirada" })
      .eq("user_id", userId)
      .in("status", ["pendente", "expirada"]);

    // Inserir nova subscrição activa
    await sb.from("subscricoes").insert({
      user_id: userId,
      status: "ativa",
      metodo_pag: "paysuite",
      referencia: event.data.id,
      valor_mt: 199,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      aprovado_em: inicio.toISOString(),
      notas_admin: `PaySuite automático — ref: ${reference}`,
    });
  }

  return NextResponse.json({ ok: true });
}
