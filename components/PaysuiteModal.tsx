"use client";
import { useState, useEffect } from "react";
import { X, Smartphone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type Metodo = "mpesa" | "emola";

export default function PaysuiteModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fecha com ESC
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  // Escuta mensagem de sucesso do PaySuite (caso venha via postMessage)
  useEffect(() => {
    const fn = (e: MessageEvent) => {
      if (e.data?.type === "payment_success" || e.data?.status === "success") {
        setSuccess(true);
        setTimeout(onSuccess, 2000);
      }
    };
    window.addEventListener("message", fn);
    return () => window.removeEventListener("message", fn);
  }, [onSuccess]);

  // Verifica se o pagamento foi concluído via URL (redirect de volta)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paysuite") === "success") {
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    }
  }, [onSuccess]);

  async function iniciarPagamento(met: Metodo) {
    setMetodo(met);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/paysuite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, metodo: met }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Erro ao iniciar pagamento. Tenta novamente.");
        setLoading(false);
        return;
      }
      setCheckoutUrl(data.checkoutUrl);
    } catch {
      setError("Erro de ligação. Verifica a internet e tenta novamente.");
    }
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />

      <div className="fixed z-[70] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-[#0D0D0D]">Activar Subscrição</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {checkoutUrl ? "Conclui o pagamento abaixo" : "Escolhe o método de pagamento"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold text-[#C9A84C]">199 MT</p>
                <p className="text-[10px] text-gray-400">/mês</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* Estado: sucesso */}
            {success && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-[#1D9E75]/10 rounded-3xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} className="text-[#1D9E75]" />
                </div>
                <h3 className="text-xl font-bold text-[#0D0D0D] mb-2">Pagamento confirmado!</h3>
                <p className="text-gray-400 text-sm">A tua subscrição está activa. Já podes candidatar-te a vagas.</p>
              </div>
            )}

            {/* Estado: escolher método */}
            {!success && !checkoutUrl && (
              <div className="p-6">
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mb-4">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  Escolhe como queres pagar. O pagamento é processado de forma segura pelo <span className="font-semibold text-[#0D0D0D]">PaySuite</span>.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: "mpesa" as Metodo, label: "M-Pesa", color: "bg-red-500", num: "846 283 051" },
                    { id: "emola" as Metodo, label: "e-Mola", color: "bg-[#C9A84C]", num: "876 252 006" },
                  ]).map(({ id, label, color, num }) => (
                    <button key={id} onClick={() => iniciarPagamento(id)} disabled={loading}
                      className="flex flex-col items-center gap-3 border-2 border-gray-100 hover:border-[#C9A84C] bg-white hover:bg-[#C9A84C]/5 rounded-2xl p-5 transition-all disabled:opacity-60 active:scale-[0.97]">
                      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
                        <Smartphone size={22} className="text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#0D0D0D] text-sm">{label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{num}</p>
                      </div>
                      {loading && metodo === id && <Loader2 size={16} className="animate-spin text-[#C9A84C]" />}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-5">
                  🔒 Pagamento seguro via PaySuite · Activação automática em segundos
                </p>
              </div>
            )}

            {/* Estado: iframe do PaySuite */}
            {!success && checkoutUrl && (
              <div className="flex-1 flex flex-col">
                {iframeBlocked ? (
                  /* Fallback se iframe bloqueado */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
                    <AlertCircle size={32} className="text-amber-500" />
                    <div>
                      <p className="font-bold text-[#0D0D0D] mb-1">Abre o pagamento</p>
                      <p className="text-sm text-gray-400 mb-4">O PaySuite não permite incorporação. Abre numa nova aba e volta aqui após pagar.</p>
                    </div>
                    <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                      className="btn-primary px-8 py-3.5 rounded-2xl text-sm">
                      Pagar 199 MT →
                    </a>
                    <button onClick={() => { setSuccess(true); setTimeout(onSuccess, 1500); }}
                      className="text-xs text-[#1D9E75] font-semibold underline underline-offset-2">
                      Já paguei — activar subscrição
                    </button>
                  </div>
                ) : (
                  <iframe
                    src={checkoutUrl}
                    className="flex-1 w-full border-0"
                    style={{ minHeight: "420px" }}
                    onError={() => setIframeBlocked(true)}
                    onLoad={(e) => {
                      try {
                        // Tenta detectar se iframe foi bloqueado
                        const doc = (e.target as HTMLIFrameElement).contentDocument;
                        if (!doc) setIframeBlocked(true);
                      } catch {
                        setIframeBlocked(true);
                      }
                    }}
                    allow="payment"
                  />
                )}
                <div className="px-6 pb-4 pt-2 shrink-0 border-t border-gray-100">
                  <button onClick={() => { setCheckoutUrl(null); setMetodo(null); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← Mudar método de pagamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
