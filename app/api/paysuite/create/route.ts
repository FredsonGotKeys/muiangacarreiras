import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, metodo } = await req.json();
    if (!userId || !metodo) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // Buscar nome do utilizador
    const { data: perfil } = await sb.from("perfis").select("nome").eq("id", userId).single();
    const nome = (perfil as { nome: string | null } | null)?.nome ?? "Utilizador";

    // Criar pagamento no PaySuite
    const res = await fetch("https://paysuite.tech/api/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSUITE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: "199.00",
        reference: `SUB-${userId.slice(0, 8)}-${Date.now()}`,
        description: `Subscrição MUIANGA CONSULTORES — ${nome}`,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/emprego?paysuite=success`,
        method: metodo, // "mpesa" | "emola"
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("PaySuite error:", err);
      return NextResponse.json({ error: "Erro ao criar pagamento." }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ checkoutUrl: data.checkout_url ?? data.url ?? data.link, paymentId: data.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
