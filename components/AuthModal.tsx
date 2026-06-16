"use client";
import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Tab = "entrar" | "registar";

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (nome: string) => void }) {
  const [tab, setTab] = useState<Tab>("registar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  // Fecha com ESC
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  function reset() { setError(null); setConfirmSent(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = getSupabaseBrowser();

    if (tab === "registar") {
      const { error: err } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
          emailRedirectTo: `${window.location.origin}/emprego`,
        },
      });
      if (err) { setError(translateError(err.message)); setLoading(false); return; }
      setConfirmSent(true);
      setLoading(false);
    } else {
      const { data, error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) { setError(translateError(err.message)); setLoading(false); return; }
      const nomeUser = data.user?.user_metadata?.nome || data.user?.email?.split("@")[0] || "Utilizador";
      onSuccess(nomeUser);
    }
  }

  function translateError(msg: string): string {
    if (msg.includes("Invalid login")) return "Email ou palavra-passe incorrectos.";
    if (msg.includes("already registered")) return "Este email já está registado. Entra na tua conta.";
    if (msg.includes("Password should")) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    if (msg.includes("valid email")) return "Introduz um endereço de email válido.";
    return "Ocorreu um erro. Tenta novamente.";
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />

      {/* Modal — bottom sheet mobile, centrado desktop */}
      <div className="fixed z-[70] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-0 sm:px-4">
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

          {/* Handle bar mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-4 pb-3 sm:pt-6">
            <div>
              <h2 className="text-xl font-bold text-[#0D0D0D]">
                {confirmSent ? "Confirma o teu email" : tab === "registar" ? "Cria a tua conta" : "Bem-vindo de volta"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {confirmSent ? "Verifica a tua caixa de entrada" : "Para te candidatares a vagas e Boladas"}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 mt-0.5">
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          {!confirmSent && (
            <div className="px-6 pb-4">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["registar", "entrar"] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); reset(); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      tab === t ? "bg-white text-[#0D0D0D] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t === "registar" ? "Criar conta" : "Entrar"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 pb-8">
            {/* Email de confirmação enviado */}
            {confirmSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-[#1D9E75]" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-1">
                  Enviámos um email de confirmação para:
                </p>
                <p className="font-bold text-[#0D0D0D] text-sm mb-4">{email}</p>
                <p className="text-gray-400 text-xs leading-relaxed mb-6">
                  Clica no link do email para activar a conta e voltar ao site. Depois entra com as tuas credenciais.
                </p>
                <button
                  onClick={() => { setConfirmSent(false); setTab("entrar"); reset(); }}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                >
                  Já confirmei — Entrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Nome — só no registo */}
                {tab === "registar" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nome completo</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text" required value={nome} onChange={e => setNome(e.target.value)}
                        placeholder="O teu nome"
                        className="w-full border border-gray-200 rounded-xl text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      className="w-full border border-gray-200 rounded-xl text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Palavra-passe</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full border border-gray-200 rounded-xl text-sm pl-10 pr-11 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-sm mt-1 active:scale-[0.98]"
                >
                  {loading ? "A processar..." : tab === "registar" ? "Criar conta gratuita →" : "Entrar →"}
                </button>

                <p className="text-xs text-center text-gray-400 pt-1">
                  {tab === "registar"
                    ? <>Ao criares conta aceitas os nossos <span className="text-[#C9A84C]">termos de uso</span>.</>
                    : <>Não tens conta? <button type="button" onClick={() => { setTab("registar"); reset(); }} className="text-[#C9A84C] font-semibold">Regista-te grátis</button></>
                  }
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
