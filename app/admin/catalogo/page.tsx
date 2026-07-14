"use client";
import { useState, useEffect, useCallback } from "react";
import {
  LogIn, LogOut, RefreshCw, Plus, Pencil, Power, Trash2, Package, Layers, CreditCard, X,
} from "lucide-react";

type Tipo = "servico" | "pacote" | "plano_subscricao";

type Item = {
  id: string;
  tipo: Tipo;
  slug: string;
  nome: string;
  descricao: string | null;
  preco_mt: number;
  periodicidade: string | null;
  config: Record<string, unknown>;
  activo: boolean;
  ordem: number;
};

type PacoteServico = { pacote_id: string; servico_id: string };

const TIPO_LABEL: Record<Tipo, { label: string; icon: React.ReactNode }> = {
  servico: { label: "Serviços", icon: <CreditCard size={14} /> },
  pacote: { label: "Pacotes", icon: <Package size={14} /> },
  plano_subscricao: { label: "Planos de Subscrição", icon: <Layers size={14} /> },
};

export default function AdminCatalogoPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [pacoteServicos, setPacoteServicos] = useState<PacoteServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editando, setEditando] = useState<Item | null>(null);
  const [criando, setCriando] = useState<Tipo | null>(null);
  const [editandoPacote, setEditandoPacote] = useState<Item | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/catalogo");
    if (r.status === 401) { setAuthed(false); setLoading(false); return; }
    if (r.ok) {
      const d = await r.json();
      setItens(d.itens ?? []);
      setPacoteServicos(d.pacoteServicos ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/admin/catalogo").then(r => { if (r.ok) { setAuthed(true); carregar(); } });
  }, [carregar]);

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
    setAuthed(false); setItens([]);
  }

  async function agir(payload: Record<string, unknown>) {
    const key = `${payload.action}-${payload.id ?? "novo"}`;
    setActionLoading(key);
    const r = await fetch("/api/admin/catalogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) alert(d.error ?? "Erro na operação.");
    await carregar();
    setActionLoading(null);
    return r.ok;
  }

  if (!authed) return (
    <div className="min-h-screen bg-[#FFF8F8] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="w-12 h-12 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mb-4">
          <LogIn size={22} className="text-[#D20001]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2A0001] mb-1">Admin · Catálogo</h1>
        <p className="text-sm text-gray-400 mb-6">MUIANGA Carreiras · Preços e pacotes</p>
        <form onSubmit={login} className="space-y-3">
          <input
            type="password"
            placeholder="Código de acesso"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D20001] focus:ring-2 focus:ring-[#D20001]/10 tracking-widest"
          />
          {authErr && <p className="text-xs text-red-500">{authErr}</p>}
          <button type="submit" className="w-full bg-[#D20001] hover:bg-[#B40001] text-white font-bold py-3.5 rounded-xl transition-all text-sm">
            Entrar →
          </button>
        </form>
      </div>
    </div>
  );

  const porTipo = (tipo: Tipo) => itens.filter(i => i.tipo === tipo).sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="min-h-screen bg-[#FFF8F8] pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2A0001]">Catálogo &amp; Preços</h1>
            <p className="text-sm text-gray-400">Serviços, pacotes e planos de subscrição</p>
          </div>
          <div className="flex gap-2">
            <button onClick={carregar} disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#D20001] bg-[#D20001]/10 hover:bg-[#D20001]/20 px-3 py-2 rounded-xl border border-[#D20001]/20 transition-all">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualizar
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all">
              <LogOut size={13} /> Sair
            </button>
          </div>
        </div>

        {(["servico", "pacote", "plano_subscricao"] as Tipo[]).map(tipo => (
          <div key={tipo} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#2A0001]">
                {TIPO_LABEL[tipo].icon} {TIPO_LABEL[tipo].label} ({porTipo(tipo).length})
              </h2>
              <button onClick={() => setCriando(tipo)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#4F0101] hover:bg-[#2A2A2A] px-3 py-2 rounded-xl transition-all">
                <Plus size={13} /> Novo
              </button>
            </div>

            <div className="space-y-2">
              {porTipo(tipo).length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-400 text-sm">Nenhum item.</p>
                </div>
              )}
              {porTipo(tipo).map(item => (
                <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between gap-3 ${item.activo ? "border-gray-100" : "border-gray-100 opacity-50"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#2A0001] truncate">{item.nome}</p>
                      {!item.activo && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">Inactivo</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{item.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black text-[#D20001] whitespace-nowrap">
                      {item.preco_mt} MT{item.periodicidade === "mensal" ? "/mês" : ""}
                    </span>
                    {tipo === "pacote" && (
                      <button onClick={() => setEditandoPacote(item)} title="Definir serviços incluídos"
                        className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">
                        <Package size={14} />
                      </button>
                    )}
                    <button onClick={() => setEditando(item)} title="Editar"
                      className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => agir({ action: item.activo ? "desactivar" : "activar", id: item.id })}
                      disabled={!!actionLoading} title={item.activo ? "Desactivar" : "Activar"}
                      className={`p-2 rounded-lg transition-all ${item.activo ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-green-50 hover:bg-green-100 text-green-600"}`}>
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Eliminar "${item.nome}"? Só resulta se não houver histórico de compras.`)) agir({ action: "eliminar", id: item.id }); }}
                      disabled={!!actionLoading} title="Eliminar"
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(editando || criando) && (
        <ItemModal
          item={editando}
          tipoNovo={criando}
          onClose={() => { setEditando(null); setCriando(null); }}
          onSave={async (payload) => {
            const ok = await agir(payload);
            if (ok) { setEditando(null); setCriando(null); }
          }}
        />
      )}

      {editandoPacote && (
        <PacoteServicosModal
          pacote={editandoPacote}
          servicos={porTipo("servico")}
          seleccionados={pacoteServicos.filter(ps => ps.pacote_id === editandoPacote.id).map(ps => ps.servico_id)}
          onClose={() => setEditandoPacote(null)}
          onSave={async (servicoIds) => {
            const ok = await agir({ action: "definir_servicos_pacote", id: editandoPacote.id, servicoIds });
            if (ok) setEditandoPacote(null);
          }}
        />
      )}
    </div>
  );
}

function ItemModal({ item, tipoNovo, onClose, onSave }: {
  item: Item | null;
  tipoNovo: Tipo | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [nome, setNome] = useState(item?.nome ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [precoMt, setPrecoMt] = useState(String(item?.preco_mt ?? ""));

  const tipo = item?.tipo ?? tipoNovo!;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#2A0001]">{item ? "Editar item" : `Novo: ${TIPO_LABEL[tipo].label}`}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D20001]" />
          </div>
          {!item && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Slug (identificador único, ex: carta-motivacao)</label>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#D20001]" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D20001]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Preço (MT{tipo === "plano_subscricao" ? "/mês" : ""})</label>
            <input type="number" min="0" step="0.01" value={precoMt} onChange={e => setPrecoMt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D20001]" />
          </div>
          <button
            onClick={() => {
              const preco = Number(precoMt);
              if (!nome.trim() || !Number.isFinite(preco) || preco < 0) { alert("Preenche nome e preço válido."); return; }
              if (item) {
                onSave({ action: "actualizar", id: item.id, nome, descricao, precoMt: preco });
              } else {
                if (!slug.trim()) { alert("Preenche o slug."); return; }
                onSave({ action: "criar", tipo, slug, nome, descricao, precoMt: preco });
              }
            }}
            className="w-full bg-[#D20001] hover:bg-[#B40001] text-white font-bold py-3 rounded-xl transition-all text-sm mt-2">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function PacoteServicosModal({ pacote, servicos, seleccionados, onClose, onSave }: {
  pacote: Item;
  servicos: Item[];
  seleccionados: string[];
  onClose: () => void;
  onSave: (servicoIds: string[]) => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(seleccionados));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#2A0001]">Serviços incluídos: {pacote.nome}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {servicos.map(s => (
            <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF8F8] cursor-pointer">
              <input type="checkbox" checked={sel.has(s.id)}
                onChange={e => setSel(prev => {
                  const next = new Set(prev);
                  if (e.target.checked) next.add(s.id); else next.delete(s.id);
                  return next;
                })} />
              <span className="text-sm font-semibold text-[#2A0001] flex-1">{s.nome}</span>
              <span className="text-xs text-gray-400">{s.preco_mt} MT</span>
            </label>
          ))}
        </div>
        <button onClick={() => onSave(Array.from(sel))}
          className="w-full bg-[#D20001] hover:bg-[#B40001] text-white font-bold py-3 rounded-xl transition-all text-sm mt-4">
          Guardar
        </button>
      </div>
    </div>
  );
}
