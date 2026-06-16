"use client";
import { useState, useEffect } from "react";
import { X, Smartphone, CheckCircle2, Clock, AlertCircle, Copy, Check } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";

type Passo = "escolher" | "instrucoes" | "confirmar" | "sucesso";

const PAGAMENTOS = {
  emola:  { label: "E-Mola",  numero: "876 252 006", cor: "bg-orange-500", corLight: "bg-orange-50", corText: "text-orange-600", corBorder: "border-orange-200" },
  mpesa:  { label: "M-Pesa",  numero: "846 283 051", cor: "bg-red-500",    corLight: "bg-red-50",    corText: "text-red-600",    corBorder: "border-red-200"    },
};

export default function SubscricaoModal({ onClose, onSucesso }: { onClose: () => void; onSucesso?: () => void }) {
  const { user } = useAuth();
  const [passo, setPasso] = useState<Passo>("escolher");
  const [metodo, setMetodo] = useState<"emola" | "mpesa" | null>(null);
  const [referencia, setReferencia] = useState("");
  const [numeroPag, setNumeroPag] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", fn); };
  }, [onClose]);

  function copiarNumero(num: string) {
    navigator.clipboard.writeText(num.replace(/\s/g, ""));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function enviarComprovativo() {
    if (!referencia.trim()) { setErro("Introduz a referência da transacção."); return; }
    if (!user) return;
    setLoading(true); setErro(null);
    const sb = getSupabaseBrowser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb.from("subscricoes") as any).insert({
      user_id: user.id,
      status: "pendente",
      metodo_pag: metodo,
      referencia: referencia.trim(),
      numero_pag: numeroPag.trim() || null,
      valor_mt: 150,
    });
    setLoading(false);
    if (error) { setErro("Erro ao enviar. Tenta novamente."); return; }
    setPasso("sucesso");
    onSucesso?.();
  }

  const pag = metodo ? PAGAMENTOS[metodo] : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed z-[70] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-0 sm:px-4">
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">

          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-4 pb-3 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-[#0D0D0D]">
                {passo === "sucesso" ? "Pedido enviado!" : "Acesso Premium"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {passo === "sucesso" ? "Aguarda aprovação" : "199 MT / 30 dias · Candidaturas ilimitadas"}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0">
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">

            {/* PASSO 1 — Escolher método */}
            {passo === "escolher" && (
              <div className="space-y-4">
                <div className="bg-[#F8F5EF] rounded-2xl p-4 space-y-1">
                  <p className="text-sm font-bold text-[#0D0D0D]">O que inclui:</p>
                  {["Candidaturas ilimitadas por 30 dias","Email pré-preenchido com o teu nome","Acesso a todas as vagas em aberto","Alertas de novas vagas (em breve)"].map(f => (
                    <p key={f} className="text-xs text-gray-500 flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#1D9E75] shrink-0" /> {f}
                    </p>
                  ))}
                </div>

                <p className="text-sm font-semibold text-[#0D0D0D]">Escolhe o método de pagamento:</p>

                <div className="grid grid-cols-2 gap-3">
                  {(["emola","mpesa"] as const).map(m => {
                    const p = PAGAMENTOS[m];
                    return (
                      <button key={m} onClick={() => { setMetodo(m); setPasso("instrucoes"); }}
                        className={`rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.97] hover:border-gray-300 ${metodo === m ? `${p.corBorder} ${p.corLight}` : "border-gray-200 bg-white"}`}
                      >
                        <div className={`w-8 h-8 ${p.cor} rounded-xl flex items-center justify-center mb-2`}>
                          <Smartphone size={16} className="text-white" />
                        </div>
                        <p className="font-bold text-sm text-[#0D0D0D]">{p.label}</p>
                        <p className="text-xs text-gray-400">{p.numero}</p>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-center text-gray-400">Pagamento manual verificado em até 24h úteis</p>
              </div>
            )}

            {/* PASSO 2 — Instruções de pagamento */}
            {passo === "instrucoes" && pag && (
              <div className="space-y-4">
                <div className={`${pag.corLight} ${pag.corBorder} border rounded-2xl p-4 space-y-3`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Envia via {pag.label}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-400">Número</p>
                        <p className="font-bold text-lg text-[#0D0D0D] tracking-wider">{pag.numero}</p>
                        <p className="text-xs text-gray-400">Em nome de <span className="font-semibold text-[#0D0D0D]">Fredson Muianga</span></p>
                      </div>
                      <button onClick={() => copiarNumero(pag.numero)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${copiado ? "bg-[#1D9E75]/10 text-[#1D9E75]" : `${pag.corLight} ${pag.corText}`}`}
                      >
                        {copiado ? <><Check size={13}/> Copiado</> : <><Copy size={13}/> Copiar</>}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200">
                      <p className="text-xs text-gray-400">Valor a pagar</p>
                      <p className="font-bold text-xl text-[#C9A84C]">199 MT</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Após enviar o pagamento, guarda a <span className="font-bold">referência/ID</span> da transacção para confirmar no passo seguinte.</p>
                </div>

                <button onClick={() => setPasso("confirmar")}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold py-4 rounded-xl transition-all text-sm active:scale-[0.98]"
                >
                  Já enviei o pagamento →
                </button>

                <button onClick={() => setPasso("escolher")} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  ← Voltar
                </button>
              </div>
            )}

            {/* PASSO 3 — Confirmar referência */}
            {passo === "confirmar" && pag && (
              <div className="space-y-4">
                <div className="bg-[#F8F5EF] rounded-xl p-3 flex items-center gap-2">
                  <Clock size={14} className="text-[#C9A84C] shrink-0" />
                  <p className="text-xs text-gray-500">Após confirmares, a tua conta será activada em até <span className="font-semibold text-[#0D0D0D]">24h úteis</span>.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Referência / ID da transacção <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text" value={referencia} onChange={e => setReferencia(e.target.value)}
                    placeholder="Ex: MP250616123456"
                    className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">Encontras no SMS de confirmação do {pag.label}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Número de onde pagaste (opcional)
                  </label>
                  <input
                    type="tel" value={numeroPag} onChange={e => setNumeroPag(e.target.value)}
                    placeholder="Ex: 876 000 000"
                    className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300"
                  />
                </div>

                {erro && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{erro}</p>
                  </div>
                )}

                <button onClick={enviarComprovativo} disabled={loading}
                  className="w-full bg-[#C9A84C] hover:bg-[#B8943E] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all text-sm active:scale-[0.98]"
                >
                  {loading ? "A enviar..." : "Confirmar pagamento →"}
                </button>

                <button onClick={() => setPasso("instrucoes")} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  ← Voltar
                </button>
              </div>
            )}

            {/* PASSO 4 — Sucesso */}
            {passo === "sucesso" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-[#1D9E75]" />
                </div>
                <div>
                  <p className="font-bold text-[#0D0D0D] text-base mb-1">Pedido recebido!</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Vamos verificar o teu pagamento e activar a conta em até <span className="font-semibold text-[#0D0D0D]">24h úteis</span>. Receberás uma notificação por email.
                  </p>
                </div>
                <div className="bg-[#F8F5EF] rounded-2xl p-4 text-left space-y-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Enquanto aguardas</p>
                  {["Explora as vagas disponíveis","Guarda o SMS do pagamento","Verifica o teu email regularmente"].map(d => (
                    <p key={d} className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" /> {d}
                    </p>
                  ))}
                </div>
                <button onClick={onClose}
                  className="w-full bg-[#0D0D0D] hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all text-sm"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
