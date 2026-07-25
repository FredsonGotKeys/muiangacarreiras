"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { CheckCircle2, AlertCircle, Loader2, Smartphone, X } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import type { CatalogoItem } from "@/lib/catalogo-client";

type Fase = "metodo" | "aguardando" | "sucesso";
type Metodo = "mpesa" | "emola";

/**
 * e-Mola temporariamente desligado — instabilidade confirmada do lado da
 * ZumboPay (erros internos de base de dados deles). Reactivar mudando
 * isto para `true`.
 */
const EMOLA_DISPONIVEL = false;

const METODOS: { id: Metodo; label: string; hint: string; logo: string; disponivel: boolean }[] = [
  { id: "mpesa", label: "M-Pesa", hint: "Confirmação directa", logo: "/images/payment/mpesa.png", disponivel: true },
  { id: "emola", label: "e-Mola", hint: "Indisponível de momento", logo: "/images/payment/emola.png", disponivel: EMOLA_DISPONIVEL },
];

const PREFIXOS_REDE: Record<Metodo, string[]> = {
  mpesa: ["84", "85"],
  emola: ["86", "87"],
};

/**
 * Fluxo de pagamento do Acesso Total — sempre embutido no local onde é
 * accionado (cartão de bloqueio, indicador da navbar, etc.), nunca como
 * modal/pop-up flutuante. Um pop-up que aparece/desaparece consoante o
 * estado de confirmação parece instabilidade; um bloco inline não tem
 * esse problema visual mesmo quando a confirmação demora.
 */
export default function PagamentoAcessoTotal({
  servico,
  onSuccess,
  onCancel,
  compacto = false,
}: {
  servico: CatalogoItem;
  onSuccess: () => void;
  onCancel: () => void;
  /** Versão mais estreita, para caber num dropdown da navbar. */
  compacto?: boolean;
}) {
  const [fase, setFase] = useState<Fase>("metodo");
  const [metodo, setMetodo] = useState<Metodo>("mpesa");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aguardandoMsg, setAguardandoMsg] = useState("");
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, []);

  async function checkStatus(): Promise<"active" | "pending" | "blocked" | "error"> {
    try {
      const res = await authFetch("/api/zumbopay/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "servico", itemId: servico.id }),
      });
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
        setError("Ainda não recebemos confirmação. Se já confirmaste no telemóvel, aguarda mais um pouco — não precisas de pagar de novo.");
        setFase("metodo");
      }
    }, 5000);
  }

  async function iniciarPagamento() {
    setError(null);
    const numero = telefone.replace(/\D/g, "");
    if (!/^\d{9}$/.test(numero)) {
      setError("Indica um número de telefone válido (9 dígitos).");
      return;
    }
    if (!PREFIXOS_REDE[metodo].includes(numero.slice(0, 2))) {
      const rede = metodo === "mpesa" ? "Vodacom (M-Pesa), começa por 84 ou 85" : "Movitel (e-Mola), começa por 86 ou 87";
      setError(`Este número não parece ser ${rede}. Confirma o número ou muda de método.`);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/zumbopay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "servico", itemId: servico.id, metodo, telefone: numero }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao iniciar pagamento.");
        setLoading(false);
        return;
      }

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

  const pad = compacto ? "p-4" : "p-6";

  return (
    <div>
      {/* FASE: escolher método e pagar */}
      {fase === "metodo" && (
        <div className={pad}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2A0001]">Escolhe o método de pagamento</h3>
              <p className="text-xs text-gray-400 mt-0.5">{servico.preco_mt} MT · pagamento seguro</p>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {METODOS.map((m) => (
              <button
                key={m.id}
                onClick={() => { if (m.disponivel) setMetodo(m.id); }}
                disabled={!m.disponivel}
                title={m.disponivel ? undefined : "e-Mola temporariamente indisponível — a ZumboPay está a resolver uma instabilidade do lado deles."}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 bg-white transition-all min-h-[92px] ${
                  !m.disponivel
                    ? "border-gray-100 opacity-50 cursor-not-allowed grayscale"
                    : metodo === m.id ? "border-[#D20001] bg-[#D20001]/5" : "border-gray-100 hover:border-gray-300"
                }`}
              >
                <div className="h-7 flex items-center justify-center">
                  <Image src={m.logo} alt={m.label} width={64} height={28} className="h-7 w-auto object-contain" />
                </div>
                <span className="text-xs font-bold text-[#2A0001]">{m.label}</span>
                <span className={`text-[10px] text-center leading-tight ${m.disponivel ? "text-gray-400" : "text-amber-600 font-semibold"}`}>{m.hint}</span>
              </button>
            ))}
          </div>

          {!EMOLA_DISPONIVEL && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                O pagamento por e-Mola está temporariamente indisponível devido a uma instabilidade da própria ZumboPay. Usa M-Pesa entretanto.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Número de telefone</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={9}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder={metodo === "mpesa" ? "84 123 4567" : "86 123 4567"}
              className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 bg-white focus:outline-none focus:border-[#D20001] focus:ring-2 focus:ring-[#D20001]/10 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mb-4">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={iniciarPagamento}
            disabled={loading}
            className="w-full bg-[#D20001] hover:bg-[#B40001] disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> A iniciar...</>
              : <><Smartphone size={16} /> Pagar {servico.preco_mt} MT com {metodo === "mpesa" ? "M-Pesa" : "e-Mola"}</>}
          </button>
        </div>
      )}

      {/* FASE: aguardando confirmação (STK push) */}
      {fase === "aguardando" && (
        <div className={`${pad} flex flex-col items-center justify-center gap-4 text-center`}>
          <div className="w-16 h-16 bg-[#D20001]/10 rounded-2xl flex items-center justify-center">
            <Loader2 size={32} className="text-[#D20001] animate-spin" />
          </div>
          <div>
            <p className="font-bold text-[#2A0001] text-base">{aguardandoMsg}</p>
            <p className="text-sm text-gray-400 mt-1">A confirmação é automática, aguarda um momento</p>
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 w-full text-left">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* FASE: sucesso */}
      {fase === "sucesso" && (
        <div className={pad}>
          <div className="text-center pt-2">
            <div className="w-16 h-16 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-[#D20001]" />
            </div>
            <h3 className="text-xl font-bold text-[#2A0001] mb-1">Acesso desbloqueado!</h3>
            <p className="text-sm text-gray-400 mb-5">Tens acesso total ao site pelas próximas 8 horas.</p>
          </div>
          <button onClick={onSuccess}
            className="w-full bg-[#D20001] hover:bg-[#B40001] text-white font-bold py-4 rounded-2xl transition-all text-sm active:scale-[0.98]">
            Continuar →
          </button>
        </div>
      )}
    </div>
  );
}
