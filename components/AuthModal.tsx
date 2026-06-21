"use client";
import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Tab = "entrar" | "registar";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (nome: string) => void }) {
  const [tab, setTab] = useState<Tab>("registar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  function reset() { setError(null); setConfirmSent(false); }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const sb = getSupabaseBrowser();
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/emprego` },
    });
    if (err) { setError(translateError(err.message)); setLoading(false); }
  }

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
    const m = msg.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return "Email ou palavra-passe incorrectos.";
    if (m.includes("already registered") || m.includes("user already")) return "Este email já está registado. Usa a aba 'Entrar'.";
    if (m.includes("password should") || m.includes("password must")) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    if (m.includes("valid email") || m.includes("invalid email")) return "Introduz um endereço de email válido.";
    if (m.includes("rate limit") || m.includes("too many")) return "Demasiadas tentativas. Aguarda alguns minutos e tenta novamente.";
    if (m.includes("email not confirmed")) return "Confirma o teu email antes de entrar. Verifica a caixa de entrada.";
    if (m.includes("user not found")) return "Não existe conta com este email. Cria uma conta primeiro.";
    if (m.includes("weak password")) return "Palavra-passe demasiado fraca. Usa pelo menos 6 caracteres.";
    if (m.includes("signup") && m.includes("disabled")) return "O registo está temporariamente desactivado. Tenta mais tarde.";
    if (m.includes("network") || m.includes("fetch")) return "Erro de ligação. Verifica a tua internet e tenta novamente.";
    if (m.includes("email link") || m.includes("otp")) return "Link expirado. Solicita um novo email de confirmação.";
    return `Erro: ${msg}`;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />

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
                  <button key={t} onClick={() => { setTab(t); reset(); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? "bg-white text-[#0D0D0D] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {t === "registar" ? "Criar conta" : "Entrar"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 pb-8">
            {confirmSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-[#1D9E75]" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-1">Enviámos um email de confirmação para:</p>
                <p className="font-bold text-[#0D0D0D] text-sm mb-4">{email}</p>
                <p className="text-gray-400 text-xs leading-relaxed mb-6">
                  Clica no link do email para activar a conta e voltar ao site. Depois entra com as tuas credenciais.
                </p>
                <button onClick={() => { setConfirmSent(false); setTab("entrar"); reset(); }}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold py-3.5 rounded-xl transition-all text-sm">
                  Já confirmei — Entrar
                </button>
              </div>
            ) : (
              <div>
                {/* Botão Google */}
                <button type="button" onClick={handleGoogle} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 text-[#0D0D0D] font-semibold text-sm py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]">
                  <GoogleIcon />
                  Continuar com Google
                </button>

                {/* Separador */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">ou com email</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Nome — só no registo */}
                  {tab === "registar" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nome completo</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                          placeholder="O teu nome"
                          className="w-full border border-gray-200 rounded-xl text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="w-full border border-gray-200 rounded-xl text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Palavra-passe</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full border border-gray-200 rounded-xl text-sm pl-10 pr-11 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
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

                  <button type="submit" disabled={loading}
                    className="w-full bg-[#C9A84C] hover:bg-[#B8943E] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-sm mt-1 active:scale-[0.98]">
                    {loading ? "A processar..." : tab === "registar" ? "Criar conta gratuita →" : "Entrar →"}
                  </button>

                  <p className="text-xs text-center text-gray-400 pt-1">
                    {tab === "registar"
                      ? <>Ao criares conta aceitas os nossos <span className="text-[#C9A84C]">termos de uso</span>.</>
                      : <>Não tens conta? <button type="button" onClick={() => { setTab("registar"); reset(); }} className="text-[#C9A84C] font-semibold">Regista-te grátis</button></>
                    }
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
