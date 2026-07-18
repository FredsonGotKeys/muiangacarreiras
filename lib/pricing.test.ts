import { describe, it, expect, vi, beforeEach } from "vitest";

// `resolverPreco` é o único sítio de onde sai o preço enviado à ZumboPay —
// nunca deve confiar num valor vindo do cliente. Estes testes mockam o
// Supabase para verificar essa garantia sem tocar na base de dados real.
// vi.mock é hoisted pelo vitest para antes de tudo — as variáveis que a
// fábrica usa têm de vir de vi.hoisted(), senão dá erro de TDZ.
const { from, maybeSingle } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ select }));
  return { from, maybeSingle };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from }),
}));

import { resolverPreco } from "./pricing";

describe("resolverPreco", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  it("devolve item_nao_encontrado quando o item não existe", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const r = await resolverPreco({ tipo: "servico", itemId: "id-inexistente" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("item_nao_encontrado");
  });

  it("devolve item_nao_encontrado (não um erro distinto) quando o item está inactivo — não revela a existência do item", async () => {
    maybeSingle.mockResolvedValue({
      data: { id: "x", tipo: "servico", slug: "acesso-total", nome: "Acesso Total", preco_mt: 59, activo: false },
    });
    const r = await resolverPreco({ tipo: "servico", itemId: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("item_nao_encontrado");
  });

  it("devolve o preço tal como está na base de dados para um item activo", async () => {
    maybeSingle.mockResolvedValue({
      data: { id: "x", tipo: "servico", slug: "acesso-total", nome: "Acesso Total", preco_mt: "59.00", activo: true },
    });
    const r = await resolverPreco({ tipo: "servico", itemId: "x" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.item.precoMt).toBe(59);
      expect(r.item.slug).toBe("acesso-total");
    }
  });
});
