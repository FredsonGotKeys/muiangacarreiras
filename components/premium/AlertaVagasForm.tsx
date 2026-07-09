"use client";
import { useState } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Opt-in simples para receber email quando surgir uma vaga que combine com
 * a palavra-chave indicada (ex: "contabilidade", "TI", "Maputo").
 */
export default function AlertaVagasForm() {
  const [email, setEmail] = useState("");
  const [palavrasChave, setPalavrasChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscrever() {
    setError(null);
    if (!email.trim() || !palavrasChave.trim()) {
      setError("Preenche o email e pelo menos uma palavra-chave.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/alertas-vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, palavrasChave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar alerta.");
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar alerta.");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-emerald-700">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> Alerta criado — vamos avisar-te por email quando surgir uma vaga compatível.
      </div>
    );
  }

  return (
    <div className="bg-[#F8F5EF] border border-gray-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-[#C9A84C]" />
        <p className="text-sm font-bold text-[#0D0D0D]">Recebe alertas de novas vagas por email</p>
      </div>
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="O teu email"
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:border-[#C9A84C]"
        />
        <input
          value={palavrasChave} onChange={(e) => setPalavrasChave(e.target.value)}
          placeholder="Palavras-chave (ex: TI, Maputo)"
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:border-[#C9A84C]"
        />
        <button onClick={subscrever} disabled={loading} className="btn-primary text-sm px-4 py-2.5 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar alerta"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
