"use client";
import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (nome: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const sb = getSupabaseBrowser();
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/emprego` },
    });
    if (err) {
      setError("Erro ao iniciar sessão com Google. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />

      <div className="fixed z-[70] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-0 sm:px-4">
        <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-2">
            <div>
              <h2 className="text-xl font-bold text-[#2A0001]">Entrar na conta</h2>
              <p className="text-sm text-gray-400 mt-0.5">Para te candidatares a vagas de emprego</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 mt-0.5">
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="px-6 pb-10 pt-6">
            {/* Logo / ícone */}
            <div className="w-16 h-16 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="font-syne text-2xl font-black text-[#D20001]">M</span>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mb-4">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 text-[#2A0001] font-semibold text-sm py-4 rounded-2xl transition-all shadow-sm active:scale-[0.98]"
            >
              <GoogleIcon />
              {loading ? "A redirecionar..." : "Continuar com Google"}
            </button>

            <p className="text-xs text-center text-gray-400 mt-5 leading-relaxed">
              Ao entrares aceitas os nossos{" "}
              <a href="/termos" className="text-[#D20001] hover:underline">termos de uso</a>
              {" "}e a nossa{" "}
              <a href="/privacidade" className="text-[#D20001] hover:underline">política de privacidade</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
