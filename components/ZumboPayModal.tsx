"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, CheckCircle2, Loader2, AlertCircle, ExternalLink, Smartphone } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

type Fase = "metodo" | "aguardando" | "sucesso";
type Metodo = "mpesa" | "emola" | "card";

const METODOS: { id: Metodo; label: string; hint: string; logo: string }[] = [
  { id: "mpesa", label: "M-Pesa", hint: "Confirmação directa", logo: "/images/payment/mpesa.png" },
  { id: "emola", label: "e-Mola", hint: "Confirmação directa", logo: "/images/payment/emola.png" },
  { id: "card",  label: "Cartão", hint: "Visa / Mastercard", logo: "/images/payment/visa-mastercard.png" },
];

export default function ZumboPayModal({
  initialFase = "metodo",
  onClose,
  onSuccess,
}: {
  initialFase?: Fase;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fase, setFase] = useState<Fase>(initialFase);
  const [metodo, setMetodo] = useState<Metodo>("mpesa");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aguardandoMsg, setAguardandoMsg] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fase !== "aguardando") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [fase, onClose]);

  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, []);

  // Regresso do checkout de cartão — já abre em "aguardando" e inicia o polling
  useEffect(() => {
    if (initialFase === "aguardando") {
      setAguardandoMsg("A confirmar o teu pagamento com cartão...");
      startPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkStatus(): Promise<"active" | "pending" | "blocked" | "error"> {
    try {
      const res = await authFetch("/api/zumbopay/confirmar", { method: "POST" });
      if (res.status === 403) return "blocked";
      if (!res.ok) return "error";
      const d = await res.json();
      return d.status === "active" ? "active" : "pending";
    } catch {
      return "error";
    }
  }

  function startPolling() {
    let attempts = 0;
    pollRef.current = window.setInterval(async () => {
      attempts++;
      const s = await checkStatus();
      if (s === "active") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        setFase("sucesso");
      } else if (s === "blocked") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        setError("Conta bloqueada. Contacta o suporte.");
        setFase("metodo");
      } else if (attempts >= 24) {
        // 24 x 5s = 2 min
        if (pollRef.current) window.clearInterval(pollRef.current);
        setError("Ainda não recebemos confirmação. Se já confirmaste no telemóvel, aguarda mais um pouco e recarrega a página.");
        setFase("metodo");
      }
    }, 5000);
  }

  async function iniciarPagamento() {
    setError(null);
    if ((metodo === "mpesa" || metodo === "emola") && !/^\d{9}$/.test(telefone.replace(/\D/g, ""))) {
      setError("Indica um número de telefone válido (9 dígitos).");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/zumbopay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo, telefone: telefone.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao iniciar pagamento.");
        setLoading(false);
        return;
      }

      if (data.mode === "redirect" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // mode === "direct" — STK push já disparado, aguardar confirmação
      setAguardandoMsg(data.message ?? "Confirma o pagamento no teu telemóvel.");
      setFase("aguardando");
      setLoading(false);

      if (data.status === "active") {
        setFase("sucesso");
      } else {
        startPolling();
      }
    } catch {
      setError("Erro de ligação. Verifica a internet.");
      setLoading(false);
    }
  }

  const headerTitle =
    fase === "sucesso"    ? "Acesso Activado!" :
    fase === "aguardando" ? "A confirmar pagamento..." :
    "Escolhe o método de pagamento";

  const headerSub =
    fase === "sucesso"    ? "30 dias de acesso completo às vagas" :
    fase === "aguardando" ? "Não feches esta janela" :
    "199 MT/mês · pagamento seguro";

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
        onClick={() => { if (fase !== "aguardando") onClose(); }} />

      <div className="fixed z-[70] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-[#0D0D0D]">{headerTitle}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{headerSub}</p>
            </div>
            {fase !== "aguardando" && (
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={15} className="text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">

            {/* FASE: escolher método */}
            {fase === "metodo" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-2">
                  {METODOS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetodo(m.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all min-h-[92px] ${
                        metodo === m.id ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-7 flex items-center justify-center">
                        <Image src={m.logo} alt={m.label} width={64} height={28} className="h-7 w-auto object-contain" />
                      </div>
                      <span className="text-xs font-bold text-[#0D0D0D]">{m.label}</span>
                      <span className="text-[10px] text-gray-400 text-center leading-tight">{m.hint}</span>
                    </button>
                  ))}
                </div>

                {(metodo === "mpesa" || metodo === "emola") && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Número de telefone</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="84 123 4567"
                      className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all"
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={iniciarPagamento}
                  disabled={loading}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> A iniciar...</>
                    : metodo === "card"
                    ? <><ExternalLink size={16} /> Continuar para pagamento</>
                    : <><Smartphone size={16} /> Pagar 199 MT com {metodo === "mpesa" ? "M-Pesa" : "e-Mola"}</>}
                </button>
              </div>
            )}

            {/* FASE: aguardando confirmação (STK push) */}
            {fase === "aguardando" && (
              <div className="p-8 flex flex-col items-center justify-center gap-5 text-center flex-1">
                <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center">
                  <Loader2 size={32} className="text-[#C9A84C] animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-[#0D0D0D] text-base">{aguardandoMsg}</p>
                  <p className="text-sm text-gray-400 mt-1">A confirmação é automática — aguarda um momento</p>
                </div>
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 w-full">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 text-left">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* FASE: sucesso */}
            {fase === "sucesso" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="text-center pt-2">
                  <div className="w-16 h-16 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={36} className="text-[#1D9E75]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0D0D0D] mb-1">Acesso activado!</h3>
                  <p className="text-sm text-gray-400">30 dias de acesso completo às vagas.</p>
                </div>

                <button onClick={() => { onSuccess(); onClose(); }}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold py-4 rounded-2xl transition-all text-sm active:scale-[0.98]">
                  Ver vagas →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
