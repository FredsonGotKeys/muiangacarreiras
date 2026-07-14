"use client";
import { useState } from "react";
import { MessageCircleQuestion, Loader2, Download, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarTextoDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import CompraGate from "@/components/premium/CompraGate";
import BlocoBloqueado from "@/components/premium/BlocoBloqueado";

interface Pergunta { pergunta: string; dica: string; }

export default function SimulacaoEntrevista({ cvData }: { cvData: Record<string, unknown> }) {
  const ent = useEntitlement("simulacao-entrevista");
  const [vagaTexto, setVagaTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[] | null>(null);
  const [compraPendente, setCompraPendente] = useState(false);

  // Gerar o guião é livre e imediato — a cobrança acontece ao descarregar.
  async function gerar() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/curriculum/entrevista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, vagaTexto: vagaTexto || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao gerar guião."); return; }
      setPerguntas(data.perguntas);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function baixarDeFacto() {
    if (!perguntas) return;
    const texto = perguntas.map((p, i) => `${i + 1}. ${p.pergunta}\n\nDica: ${p.dica}`).join("\n\n\n");
    const blob = await gerarTextoDocx("Guião de Preparação para Entrevista", texto);
    const nomeFicheiro = "Guiao_Entrevista.docx";
    downloadBlob(blob, nomeFicheiro);
    guardarDocumento("simulacao-entrevista", nomeFicheiro, blob);
  }

  function baixar() {
    if (ent.checking) return;
    if (!ent.unlocked) { setCompraPendente(true); return; }
    baixarDeFacto();
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{ background: "linear-gradient(135deg, rgba(237,29,29,0.04) 0%, rgba(254,0,0,0.04) 100%)", border: "1px solid rgba(237,29,29,0.15)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #ED1D1D, #FE0000)" }}>
          <MessageCircleQuestion className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#2A0001]">Simulação de Entrevista</h3>
          <p className="text-[11px] text-gray-400">Perguntas prováveis e dicas de resposta, baseadas no teu perfil</p>
        </div>
      </div>

      <textarea
        value={vagaTexto}
        onChange={(e) => setVagaTexto(e.target.value)}
        placeholder="Cola aqui a descrição da vaga (opcional) para perguntas mais específicas..."
        rows={3}
        className="input-vivid w-full mb-3"
      />

      {!loading && (
        <button onClick={gerar} className="btn-vivid text-xs px-4 py-2.5 mb-4">
          <MessageCircleQuestion className="w-3.5 h-3.5" /> Gerar guião de entrevista
        </button>
      )}

      {compraPendente && (
        <div className="mb-4">
          <CompraGate servicoSlug="simulacao-entrevista" servicoNome="Descarregar guião de entrevista" onUnlock={() => { setCompraPendente(false); baixarDeFacto(); }}>
            {null}
          </CompraGate>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> A preparar as perguntas...
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {perguntas && !loading && (
          <div>
            <div className="space-y-3 mb-4">
              {perguntas.slice(0, 1).map((p, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-bold text-[#2A0001] mb-1">{i + 1}. {p.pergunta}</p>
                  <p className="text-xs text-gray-500">{p.dica}</p>
                </div>
              ))}
              {perguntas.length > 1 && (
                <BlocoBloqueado
                  unlocked={ent.unlocked}
                  onDesbloquear={() => setCompraPendente(true)}
                  precoMt={ent.servico?.preco_mt}
                  minHeight={160}
                >
                  <div className="space-y-3">
                    {perguntas.slice(1).map((p, i) => (
                      <div key={i + 1} className="bg-white border border-gray-100 rounded-xl p-4">
                        <p className="text-sm font-bold text-[#2A0001] mb-1">{i + 2}. {p.pergunta}</p>
                        <p className="text-xs text-gray-500">{p.dica}</p>
                      </div>
                    ))}
                  </div>
                </BlocoBloqueado>
              )}
            </div>
            <button onClick={baixar} className="btn-vivid-outline text-xs px-4 py-2.5">
              {!ent.checking && !ent.unlocked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {!ent.checking && !ent.unlocked ? `Descarregar guião: ${ent.servico?.preco_mt ?? "..."} MT` : "Descarregar guião (.docx)"}
            </button>
          </div>
        )}
    </div>
  );
}
