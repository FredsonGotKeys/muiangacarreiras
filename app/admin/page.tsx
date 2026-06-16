"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, RefreshCw, LogIn, LogOut, Smartphone } from "lucide-react";

type Sub = {
  id: string; status: string; metodo_pag: string | null;
  referencia: string | null; numero_pag: string | null;
  valor_mt: number; created_at: string; notas_admin: string | null;
  perfis: { nome: string | null } | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pendente:  { label: "Pendente",  cls: "bg-amber-100 text-amber-700" },
  ativa:     { label: "Activa",    cls: "bg-green-100 text-green-700" },
  expirada:  { label: "Expirada",  cls: "bg-gray-100 text-gray-500"  },
  rejeitada: { label: "Rejeitada", cls: "bg-red-100 text-red-600"    },
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [authErr, setAuthErr]   = useState("");
  const [subs, setSubs]         = useState<Sub[]>([]);
  const [loading, setLoading]   = useState(false);
  const [notas, setNotas]       = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtro, setFiltro]     = useState<"todos" | "pendente">("pendente");

  const carregar = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/admin/subscricoes");
    if (r.status === 401) { setAuthed(false); setLoading(false); return; }
    if (r.ok) setSubs(await r.json());
    setLoading(false);
  }, []);

  // Tenta carregar ao montar (se já tem cookie)
  useEffect(() => {
    fetch("/admin/subscricoes").then(r => {
      if (r.ok) { setAuthed(true); r.json().then(setSubs); }
    });
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAuthErr("");
    const r = await fetch("/admin/subscricoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password }),
    });
    if (r.ok) { setAuthed(true); carregar(); }
    else { const d = await r.json(); setAuthErr(d.error ?? "Erro."); }
  }

  async function logout() {
    await fetch("/admin/subscricoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAuthed(false); setSubs([]);
  }

  async function agir(id: string, acao: "aprovar" | "rejeitar") {
    setActionLoading(id + acao);
    await fetch("/admin/subscricoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, acao, notas: notas[id] }),
    });
    await carregar();
    setActionLoading(null);
  }

  const lista = filtro === "pendente" ? subs.filter(s => s.status === "pendente") : subs;
  const pendentes = subs.filter(s => s.status === "pendente").length;

  if (!authed) return (
    <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center mb-4">
          <LogIn size={22} className="text-[#C9A84C]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0D0D0D] mb-1">Admin</h1>
        <p className="text-sm text-gray-400 mb-6">MUIANGA Consultores — Painel de pagamentos</p>
        <form onSubmit={login} className="space-y-3">
          <input type="password" placeholder="Palavra-passe" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10"
          />
          {authErr && <p className="text-xs text-red-500">{authErr}</p>}
          <button type="submit" className="w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold py-3.5 rounded-xl transition-all text-sm">
            Entrar →
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F5EF] pt-8 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Subscrições</h1>
            <p className="text-sm text-gray-400">{pendentes} pendente{pendentes !== 1 ? "s" : ""} de aprovação</p>
          </div>
          <div className="flex gap-2">
            <button onClick={carregar} disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 px-3 py-2 rounded-xl border border-[#C9A84C]/20 transition-all"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualizar
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all"
            >
              <LogOut size={13} /> Sair
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {(["pendente","todos"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${filtro === f ? "bg-[#0D0D0D] text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              {f === "pendente" ? `Pendentes (${pendentes})` : "Todos"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {lista.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 text-sm">{filtro === "pendente" ? "Nenhum pagamento pendente." : "Sem registos."}</p>
            </div>
          )}
          {lista.map(s => {
            const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.pendente;
            const metPag = s.metodo_pag === "emola" ? "E-Mola" : s.metodo_pag === "mpesa" ? "M-Pesa" : s.metodo_pag;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#0D0D0D]">{s.perfis?.nome ?? "—"}</p>
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString("pt-PT")}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Método</p>
                    <p className="text-sm font-semibold text-[#0D0D0D] flex items-center gap-1"><Smartphone size={13} className="text-[#C9A84C]"/> {metPag ?? "—"}</p>
                  </div>
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Valor</p>
                    <p className="text-sm font-semibold text-[#C9A84C]">{s.valor_mt} MT</p>
                  </div>
                  <div className="bg-[#F8F5EF] rounded-xl p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Referência</p>
                    <p className="text-sm font-mono font-semibold text-[#0D0D0D] break-all">{s.referencia ?? "—"}</p>
                    {s.numero_pag && <p className="text-xs text-gray-400 mt-0.5">De: {s.numero_pag}</p>}
                  </div>
                </div>
                {s.status === "pendente" && (
                  <>
                    <input type="text" placeholder="Notas (opcional)"
                      value={notas[s.id] ?? ""} onChange={e => setNotas(n => ({ ...n, [s.id]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl text-xs px-3 py-2.5 mb-3 focus:outline-none focus:border-[#C9A84C]"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => agir(s.id, "aprovar")} disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all"
                      >
                        <CheckCircle2 size={15}/> {actionLoading === s.id + "aprovar" ? "..." : "Aprovar (+30 dias)"}
                      </button>
                      <button onClick={() => agir(s.id, "rejeitar")} disabled={!!actionLoading}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-bold text-sm px-4 py-3 rounded-xl transition-all"
                      >
                        <XCircle size={15}/> {actionLoading === s.id + "rejeitar" ? "..." : "Rejeitar"}
                      </button>
                    </div>
                  </>
                )}
                {s.notas_admin && s.status !== "pendente" && (
                  <p className="text-xs text-gray-400 mt-2">Notas: {s.notas_admin}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
