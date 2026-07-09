"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, RefreshCw, LogIn, LogOut,
  ShieldOff, ShieldCheck, Zap, Users, AlertTriangle, Ban,
  Globe2, FileText, ExternalLink, Trash2,
} from "lucide-react";

type Candidatura = {
  id: string;
  nome: string;
  email: string;
  vaga_titulo: string;
  vaga_empresa: string | null;
  vaga_zona: string | null;
  vaga_url: string | null;
  cv_url: string | null;
  status: string;
  notas_admin: string | null;
  created_at: string;
};

type Sub = {
  id: string;
  user_id: string;
  status: string;
  metodo_pag: string | null;
  referencia: string | null;
  numero_pag: string | null;
  valor_mt: number;
  created_at: string;
  inicio: string | null;
  fim: string | null;
  aprovado_em: string | null;
  notas_admin: string | null;
  email: string | null;
  perfis: { nome: string | null; bloqueado: boolean } | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pendente:   { label: "Pendente",   cls: "bg-amber-100 text-amber-700" },
  ativa:      { label: "Activa",     cls: "bg-green-100 text-green-700" },
  expirada:   { label: "Expirada",   cls: "bg-gray-100 text-gray-500"  },
  rejeitada:  { label: "Rejeitada",  cls: "bg-red-100 text-red-600"    },
};

function diasRestantes(fim: string | null): number | null {
  if (!fim) return null;
  const diff = new Date(fim).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type Filtro = "ativos" | "pendente" | "todos" | "bloqueados";
type AdminTab = "subscricoes" | "candidaturas";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [authErr, setAuthErr]   = useState("");
  const [subs, setSubs]         = useState<Sub[]>([]);
  const [loading, setLoading]   = useState(false);
  const [notas, setNotas]       = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtro, setFiltro]     = useState<Filtro>("ativos");
  const [adminTab, setAdminTab] = useState<AdminTab>("subscricoes");
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [candLoading, setCandLoading]   = useState(false);
  const [candFiltro, setCandFiltro]     = useState<"nova" | "tratada" | "todas">("nova");

  const carregar = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/admin/subscricoes");
    if (r.status === 401) { setAuthed(false); setLoading(false); return; }
    if (r.ok) setSubs(await r.json());
    setLoading(false);
  }, []);

  const carregarCandidaturas = useCallback(async () => {
    setCandLoading(true);
    const r = await fetch("/admin/subscricoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list_candidaturas" }),
    });
    if (r.ok) setCandidaturas(await r.json());
    setCandLoading(false);
  }, []);

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

  async function agir(action: string, id?: string, userId?: string) {
    const key = `${action}-${id ?? userId}`;
    setActionLoading(key);
    await fetch("/admin/subscricoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, userId, notas: id ? notas[id] : undefined }),
    });
    await carregar();
    setActionLoading(null);
  }

  async function agirCand(id: string, action: "tratada" | "eliminar") {
    setActionLoading(`cand-${id}`);
    await fetch("/admin/subscricoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: `cand_${action}`, id }),
    });
    await carregarCandidaturas();
    setActionLoading(null);
  }

  const ativos    = subs.filter(s => s.status === "ativa");
  const pendentes = subs.filter(s => s.status === "pendente");
  const bloqueados = subs.filter(s => s.perfis?.bloqueado);

  const lista = filtro === "ativos"
    ? ativos
    : filtro === "pendente"
    ? pendentes
    : filtro === "bloqueados"
    ? bloqueados
    : subs;

  if (!authed) return (
    <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center mb-4">
          <LogIn size={22} className="text-[#C9A84C]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0D0D0D] mb-1">Admin</h1>
        <p className="text-sm text-gray-400 mb-6">MUIANGA Carreiras · Gestão de subscrições</p>
        <form onSubmit={login} className="space-y-3">
          <input
            type="password"
            placeholder="Código de acesso"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 tracking-widest"
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
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Painel Admin</h1>
            <p className="text-sm text-gray-400">MUIANGA Carreiras</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { adminTab === "subscricoes" ? carregar() : carregarCandidaturas(); }} disabled={loading || candLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 px-3 py-2 rounded-xl border border-[#C9A84C]/20 transition-all">
              <RefreshCw size={13} className={(loading || candLoading) ? "animate-spin" : ""} /> Actualizar
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all">
              <LogOut size={13} /> Sair
            </button>
          </div>
        </div>

        {/* Admin tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
          <button onClick={() => setAdminTab("subscricoes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${adminTab === "subscricoes" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-gray-500"}`}>
            <Zap size={14} /> Subscrições
          </button>
          <button onClick={() => { setAdminTab("candidaturas"); if (candidaturas.length === 0) carregarCandidaturas(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${adminTab === "candidaturas" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-gray-500"}`}>
            <Globe2 size={14} /> Candidaturas Europa
            {candidaturas.filter(c => c.status === "nova").length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {candidaturas.filter(c => c.status === "nova").length}
              </span>
            )}
          </button>
        </div>

        {/* ═══ TAB SUBSCRIÇÕES ═══ */}
        {adminTab === "subscricoes" && <>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Activos", value: ativos.length, icon: <Zap size={16} className="text-[#C9A84C]" />, cls: "border-[#C9A84C]/20" },
            { label: "Pendentes", value: pendentes.length, icon: <Clock size={16} className="text-amber-500" />, cls: pendentes.length > 0 ? "border-amber-200 bg-amber-50" : "" },
            { label: "Total", value: subs.length, icon: <Users size={16} className="text-blue-500" />, cls: "" },
            { label: "Bloqueados", value: bloqueados.length, icon: <Ban size={16} className="text-red-500" />, cls: bloqueados.length > 0 ? "border-red-200 bg-red-50" : "" },
          ].map(({ label, value, icon, cls }) => (
            <div key={label} className={`bg-white rounded-2xl border border-gray-100 ${cls} p-4 flex items-center gap-3`}>
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <p className="text-2xl font-black text-[#0D0D0D] leading-none">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            { key: "ativos",    label: `Activos (${ativos.length})` },
            { key: "pendente",  label: `Pendentes (${pendentes.length})` },
            { key: "todos",     label: "Todos" },
            { key: "bloqueados",label: `Bloqueados (${bloqueados.length})` },
          ] as { key: Filtro; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${filtro === f.key ? "bg-[#0D0D0D] text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {lista.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 text-sm">Nenhum registo para este filtro.</p>
            </div>
          )}

          {lista.map(s => {
            const st   = STATUS_LABEL[s.status] ?? STATUS_LABEL.pendente;
            const dias = diasRestantes(s.fim);
            const bloqueado = s.perfis?.bloqueado ?? false;
            const metLabel = s.metodo_pag === "emola" ? "e-Mola" : s.metodo_pag === "mpesa" ? "M-Pesa" : s.metodo_pag === "card" ? "Cartão" : s.metodo_pag === "paysuite" ? "PaySuite (legado)" : (s.metodo_pag ?? "—");

            return (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${bloqueado ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}>

                {/* Linha topo */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bloqueado ? "bg-red-100" : "bg-[#C9A84C]/10"}`}>
                      {bloqueado
                        ? <Ban size={18} className="text-red-500" />
                        : <span className="text-[#C9A84C] font-black text-sm">{(s.perfis?.nome ?? "?")[0]?.toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className="font-bold text-[#0D0D0D]">{s.perfis?.nome ?? "—"}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.email ?? "sem email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {bloqueado && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Bloqueado</span>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>
                </div>

                {/* Grid info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Método</p>
                    <p className="text-sm font-semibold text-[#0D0D0D]">{metLabel}</p>
                  </div>
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Valor</p>
                    <p className="text-sm font-semibold text-[#C9A84C]">{s.valor_mt} MT</p>
                  </div>
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Início</p>
                    <p className="text-sm font-semibold text-[#0D0D0D]">{formatDate(s.inicio ?? s.created_at)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${s.status === "ativa" && dias !== null && dias <= 5 ? "bg-amber-50 border border-amber-100" : "bg-[#F8F5EF]"}`}>
                    <p className="text-xs text-gray-400 mb-0.5">Dias restantes</p>
                    {s.status === "ativa" && dias !== null ? (
                      <p className={`text-sm font-black ${dias <= 5 ? "text-amber-600" : dias <= 10 ? "text-orange-500" : "text-[#1D9E75]"}`}>
                        {dias}d {dias <= 5 && <AlertTriangle size={11} className="inline" />}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">—</p>
                    )}
                  </div>
                </div>

                {/* Referência */}
                {s.referencia && (
                  <div className="bg-[#F8F5EF] rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-xs text-gray-400">Referência: <span className="font-mono font-semibold text-[#0D0D0D]">{s.referencia}</span></p>
                    {s.numero_pag && <p className="text-xs text-gray-400 mt-0.5">De: {s.numero_pag}</p>}
                  </div>
                )}

                {/* Notas admin */}
                {s.notas_admin && (
                  <p className="text-xs text-gray-400 mb-3 italic">Notas: {s.notas_admin}</p>
                )}

                {/* Acções */}
                <div className="flex flex-wrap gap-2">
                  {/* Aprovar pendente */}
                  {s.status === "pendente" && (
                    <>
                      <input
                        type="text"
                        placeholder="Notas (opcional)"
                        value={notas[s.id] ?? ""}
                        onChange={e => setNotas(n => ({ ...n, [s.id]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl text-xs px-3 py-2.5 mb-1 focus:outline-none focus:border-[#C9A84C]"
                      />
                      <button
                        onClick={() => agir("aprovar", s.id)}
                        disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                      >
                        <CheckCircle2 size={13} />
                        {actionLoading === `aprovar-${s.id}` ? "..." : "Aprovar (+30 dias)"}
                      </button>
                      <button
                        onClick={() => agir("rejeitar", s.id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                      >
                        <XCircle size={13} />
                        {actionLoading === `rejeitar-${s.id}` ? "..." : "Rejeitar"}
                      </button>
                    </>
                  )}

                  {/* Revogar activa */}
                  {s.status === "ativa" && (
                    <button
                      onClick={() => agir("revogar", s.id)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 disabled:opacity-60 text-orange-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-orange-200"
                    >
                      <ShieldOff size={13} />
                      {actionLoading === `revogar-${s.id}` ? "A revogar..." : "Revogar acesso"}
                    </button>
                  )}

                  {/* Bloquear / desbloquear utilizador */}
                  {!bloqueado ? (
                    <button
                      onClick={() => agir("bloquear", undefined, s.user_id)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-red-200"
                    >
                      <Ban size={13} />
                      {actionLoading === `bloquear-${s.user_id}` ? "A bloquear..." : "Bloquear utilizador"}
                    </button>
                  ) : (
                    <button
                      onClick={() => agir("desbloquear", undefined, s.user_id)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 disabled:opacity-60 text-green-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-green-200"
                    >
                      <ShieldCheck size={13} />
                      {actionLoading === `desbloquear-${s.user_id}` ? "..." : "Desbloquear"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>}

        {/* ═══ TAB CANDIDATURAS EUROPA ═══ */}
        {adminTab === "candidaturas" && <>

          {/* Filtros */}
          <div className="flex gap-2 mb-5">
            {([
              { key: "nova",    label: `Novas (${candidaturas.filter(c => c.status === "nova").length})` },
              { key: "tratada", label: "Tratadas" },
              { key: "todas",   label: "Todas" },
            ] as { key: typeof candFiltro; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setCandFiltro(f.key)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${candFiltro === f.key ? "bg-[#0D0D0D] text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {candLoading && <p className="text-sm text-gray-400 py-8 text-center">A carregar...</p>}

          <div className="space-y-3">
            {!candLoading && (candFiltro === "todas" ? candidaturas : candidaturas.filter(c => c.status === candFiltro)).length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">Nenhuma candidatura {candFiltro === "nova" ? "nova" : ""} de momento.</p>
              </div>
            )}

            {(candFiltro === "todas" ? candidaturas : candidaturas.filter(c => c.status === candFiltro)).map(c => (
              <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${c.status === "nova" ? "border-blue-200 bg-blue-50/20" : "border-gray-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Globe2 size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0D0D0D]">{c.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === "nova" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.status === "nova" ? "Nova" : "Tratada"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Vaga</p>
                    <p className="text-sm font-semibold text-[#0D0D0D]">{c.vaga_titulo}</p>
                  </div>
                  <div className="bg-[#F8F5EF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
                    <p className="text-sm font-semibold text-[#0D0D0D]">{c.vaga_empresa ?? "—"}</p>
                  </div>
                </div>

                {c.vaga_zona && (
                  <p className="text-xs text-gray-400 mb-3">📍 {c.vaga_zona} · {formatDate(c.created_at)}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {c.cv_url && (
                    <button
                      onClick={async () => {
                        const r = await fetch("/admin/subscricoes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "cand_cv_url", id: c.id }),
                        });
                        if (r.ok) {
                          const { url } = await r.json();
                          if (url) window.open(url, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-blue-200">
                      <FileText size={13} /> Ver CV
                    </button>
                  )}
                  {c.vaga_url && (
                    <a href={c.vaga_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-gray-200">
                      <ExternalLink size={13} /> Vaga original
                    </a>
                  )}
                  {c.status === "nova" && (
                    <button onClick={() => agirCand(c.id, "tratada")} disabled={!!actionLoading}
                      className="flex items-center gap-1.5 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 text-[#1D9E75] font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-[#1D9E75]/30">
                      <CheckCircle2 size={13} /> {actionLoading === `cand-${c.id}` ? "..." : "Marcar como tratada"}
                    </button>
                  )}
                  <button onClick={() => agirCand(c.id, "eliminar")} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-red-200">
                    <Trash2 size={13} /> {actionLoading === `cand-${c.id}` ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>}

      </div>
    </div>
  );
}
