"use client";
import { useState } from "react";
import { FileCheck2, Loader2, Download, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarCvDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import CompraGate from "@/components/premium/CompraGate";

interface CvDataLike {
  nome: string; titulo: string; telefone: string; email: string; endereco: string; cidade: string;
  objectivo: string;
  formacao: { instituicao: string; curso: string; grau: string; anoInicio: string; anoFim: string; descricao: string }[];
  experiencia: { empresa: string; cargo: string; local: string; dataInicio: string; dataFim: string; actualmente: boolean; descricao: string }[];
  competenciasTecnicas: string[]; competenciasInformaticas: string[];
  linguas: { lingua: string; nivel: string }[];
}

export default function ConversaoATS({ cvData }: { cvData: Record<string, unknown> }) {
  const ent = useEntitlement("conversao-ats");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [resultado, setResultado] = useState<{ objectivo: string; experiencia: { cargo: string; empresa: string; descricao: string }[] } | null>(null);
  const [compraPendente, setCompraPendente] = useState(false);

  // Optimizar é livre e imediato — a cobrança acontece ao descarregar o resultado.
  async function otimizar() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/curriculum/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao optimizar CV."); return; }
      setResultado(data);
      setPronto(true);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function baixarDeFacto() {
    if (!resultado) return;
    const merged: CvDataLike = {
      ...(cvData as unknown as CvDataLike),
      objectivo: resultado.objectivo,
      experiencia: (cvData.experiencia as CvDataLike["experiencia"]).map((e, i) => ({
        ...e,
        descricao: resultado.experiencia[i]?.descricao ?? e.descricao,
      })),
    };
    const blob = await gerarCvDocx(merged, "000000");
    const nomeFicheiro = `CV_ATS_${((cvData.nome as string) || "curriculo").replace(/\s+/g, "_")}.docx`;
    downloadBlob(blob, nomeFicheiro);
    guardarDocumento("conversao-ats", nomeFicheiro, blob);
  }

  function baixar() {
    if (ent.checking) return;
    if (!ent.unlocked) { setCompraPendente(true); return; }
    baixarDeFacto();
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.04) 0%, rgba(138,99,99,0.04) 100%)", border: "1px solid rgba(15,23,42,0.12)" }}
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #2A0001, #8A6363)" }}>
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2A0001]">Conversão para ATS</h3>
            <p className="text-[11px] text-gray-400">Reescreve o teu CV para passar melhor pelos sistemas automáticos de triagem</p>
          </div>
        </div>
        {!loading && !pronto && (
          <button onClick={otimizar} className="btn-vivid text-xs px-4 py-2.5">
            <FileCheck2 className="w-3.5 h-3.5" /> Optimizar para ATS
          </button>
        )}
      </div>

      {compraPendente && (
        <div className="mb-4">
          <CompraGate servicoSlug="conversao-ats" servicoNome="Descarregar CV optimizado para ATS" onUnlock={() => { setCompraPendente(false); baixarDeFacto(); }}>
            {null}
          </CompraGate>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> A optimizar o teu CV para leitura automática...
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {pronto && resultado && !loading && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-3">CV optimizado: palavras-chave e frases reescritas para leitura automática, mantendo os factos originais.</p>
            <button onClick={baixar} className="btn-vivid-outline text-xs px-4 py-2.5">
              {!ent.checking && !ent.unlocked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {!ent.checking && !ent.unlocked ? `Descarregar CV optimizado: ${ent.servico?.preco_mt ?? "..."} MT` : "Descarregar CV optimizado (.docx)"}
            </button>
          </div>
        )}
    </div>
  );
}
