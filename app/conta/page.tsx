"use client";
import { useState, useEffect, useCallback } from "react";
import {
  UserCircle2, Save, Loader2, CheckCircle2, Clock, XCircle, ShieldAlert,
  Package, CreditCard, LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import AuthModal from "@/components/AuthModal";
import MeusDocumentos from "@/components/premium/MeusDocumentos";

type Compra = {
  id: string; tipo: string; preco_mt: number; status: string; created_at: string;
  catalogo_itens: { nome: string } | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  pendente: { label: "Pendente", cls: "bg-amber-100 text-amber-700", Icon: Clock },
  concluida: { label: "Concluída", cls: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  ativa: { label: "Activa", cls: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  rejeitada: { label: "Rejeitada", cls: "bg-red-100 text-red-600", Icon: XCircle },
  expirada: { label: "Expirada", cls: "bg-gray-100 text-gray-500", Icon: XCircle },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ContaPage() {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={24} /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8F8] flex items-center justify-center px-4 pt-20">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <LogIn size={22} className="text-[#D20001]" />
          </div>
          <h1 className="text-xl font-bold text-[#2A0001] mb-2">Inicia sessão</h1>
          <p className="text-sm text-gray-400 mb-6">Para veres a tua conta, perfil, subscrição e documentos.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary w-full justify-center">Entrar →</button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      </div>
    );
  }

  return <ContaConteudo />;
}

function ContaConteudo() {
  const { user, signOut } = useAuth();
  const nomeUser: string = (user?.user_metadata?.nome as string | undefined) || user?.email?.split("@")[0] || "";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  const [compras, setCompras] = useState<Compra[]>([]);
  const [carregandoCompras, setCarregandoCompras] = useState(true);

  const carregarPerfil = useCallback(async () => {
    if (!user) return;
    setCarregandoPerfil(true);
    const sb = getSupabaseBrowser();
    const { data } = await sb.from("perfis").select("nome, telefone, bloqueado").eq("id", user.id).maybeSingle();
    const p = data as { nome: string | null; telefone: string | null; bloqueado: boolean } | null;
    setNome(p?.nome ?? "");
    setTelefone(p?.telefone ?? "");
    setBloqueado(p?.bloqueado ?? false);
    setCarregandoPerfil(false);
  }, [user]);

  const carregarCompras = useCallback(async () => {
    if (!user) return;
    setCarregandoCompras(true);
    const sb = getSupabaseBrowser();
    const { data } = await sb
      .from("compras")
      .select("id, tipo, preco_mt, status, created_at, catalogo_itens(nome)")
      .order("created_at", { ascending: false })
      .limit(20);
    setCompras((data as unknown as Compra[] | null) ?? []);
    setCarregandoCompras(false);
  }, [user]);

  useEffect(() => {
    carregarPerfil();
    carregarCompras();
  }, [carregarPerfil, carregarCompras]);

  async function guardarPerfil() {
    if (!user) return;
    setSalvando(true);
    setSalvo(false);
    const sb = getSupabaseBrowser();
    await (sb.from("perfis") as unknown as { update: (row: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
      .update({ nome: nome || null, telefone: telefone || null }).eq("id", user.id);
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#FFF8F8] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D20001]/10 rounded-2xl flex items-center justify-center">
              <UserCircle2 size={24} className="text-[#D20001]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2A0001]">{nomeUser || "A tua conta"}</h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-all">
            Sair
          </button>
        </div>

        {bloqueado && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">A tua conta está bloqueada. Contacta o suporte para mais informação.</p>
          </div>
        )}

        {/* Perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-[#2A0001] mb-4">Perfil</h2>
          {carregandoPerfil ? (
            <Loader2 size={16} className="animate-spin text-gray-300" />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D20001]" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Telefone</label>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D20001]" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button onClick={guardarPerfil} disabled={salvando}
                  className="btn-primary text-sm disabled:opacity-60">
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                </button>
                {salvo && <span className="text-xs text-emerald-600 font-semibold">Guardado ✓</span>}
              </div>
            </div>
          )}
        </div>

        {/* Histórico de compras */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-[#2A0001] mb-4 flex items-center gap-2"><CreditCard size={15} className="text-[#D20001]" /> Histórico de compras</h2>
          {carregandoCompras ? (
            <Loader2 size={16} className="animate-spin text-gray-300" />
          ) : compras.length === 0 ? (
            <p className="text-xs text-gray-400">Ainda não fizeste nenhuma compra avulsa.</p>
          ) : (
            <div className="space-y-2">
              {compras.map((c) => {
                const st = STATUS_LABEL[c.status] ?? STATUS_LABEL.pendente;
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#FFF8F8]">
                    <div className="flex items-center gap-2 min-w-0">
                      {c.tipo === "pacote" ? <Package size={14} className="text-gray-400 shrink-0" /> : <CreditCard size={14} className="text-gray-400 shrink-0" />}
                      <span className="text-xs font-semibold text-[#2A0001] truncate">{c.catalogo_itens?.nome ?? "Serviço"}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(c.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-[#D20001]">{c.preco_mt} MT</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Documentos */}
        <MeusDocumentos />
      </div>
    </div>
  );
}
