"use client";
import { useState } from "react";
import { Languages, Loader2, Download, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarCvDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import CompraGate from "@/components/premium/CompraGate";

interface CvDataLike {
  nome: string; titulo: string; telefone: string; email: string; endereco: string; cidade: string; objectivo: string;
  formacao: { instituicao: string; curso: string; grau: string; anoInicio: string; anoFim: string; descricao: string }[];
  experiencia: { empresa: string; cargo: string; local: string; dataInicio: string; dataFim: string; actualmente: boolean; descricao: string }[];
  competenciasTecnicas: string[]; competenciasInformaticas: string[];
  linguas: { lingua: string; nivel: string }[];
}

const IDIOMAS = [{ id: "en", label: "Inglês" }, { id: "fr", label: "Francês" }];

export default function TraducaoCv({ cvData }: { cvData: Record<string, unknown> }) {
  const ent = useEntitlement("traducao-cv");
  const [idioma, setIdioma] = useState<"en" | "fr">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [compraPendente, setCompraPendente] = useState(false);

  // Traduzir é livre e imediato — a cobrança acontece ao descarregar o resultado.
  async function traduzir() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/curriculum/traduzir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, idioma }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao traduzir CV."); return; }
      setResultado(data);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function baixarDeFacto() {
    if (!resultado) return;
    const original = cvData as unknown as CvDataLike;
    const experienciaTraduzida = (resultado.experiencia as { cargo: string; descricao: string }[] | undefined) ?? [];
    const formacaoTraduzida = (resultado.formacao as { curso: string; descricao: string }[] | undefined) ?? [];
    const merged: CvDataLike = {
      ...original,
      titulo: (resultado.titulo as string) ?? original.titulo,
      objectivo: (resultado.objectivo as string) ?? original.objectivo,
      experiencia: original.experiencia.map((e, i) => ({ ...e, cargo: experienciaTraduzida[i]?.cargo ?? e.cargo, descricao: experienciaTraduzida[i]?.descricao ?? e.descricao })),
      formacao: original.formacao.map((f, i) => ({ ...f, curso: formacaoTraduzida[i]?.curso ?? f.curso, descricao: formacaoTraduzida[i]?.descricao ?? f.descricao })),
    };
    const blob = await gerarCvDocx(merged);
    const nomeFicheiro = `CV_${idioma.toUpperCase()}_${((original.nome as string) || "curriculo").replace(/\s+/g, "_")}.docx`;
    downloadBlob(blob, nomeFicheiro);
    guardarDocumento("traducao-cv", nomeFicheiro, blob);
  }

  function baixar() {
    if (ent.checking) return;
    if (!ent.unlocked) { setCompraPendente(true); return; }
    baixarDeFacto();
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{ background: "linear-gradient(135deg, rgba(210,0,1,0.04) 0%, rgba(254,0,0,0.04) 100%)", border: "1px solid rgba(254,0,0,0.15)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #D20001, #FE0000)" }}>
          <Languages className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#2A0001]">Tradução de CV</h3>
          <p className="text-[11px] text-gray-400">Traduz o teu CV para candidaturas internacionais</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {IDIOMAS.map((i) => (
          <button key={i.id} onClick={() => setIdioma(i.id as "en" | "fr")}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${idioma === i.id ? "bg-[#FE0000] text-white" : "bg-gray-100 text-gray-500"}`}>
            {i.label}
          </button>
        ))}
        {!loading && (
          <button onClick={traduzir} className="btn-vivid text-xs px-4 py-2.5 ml-auto">
            <Languages className="w-3.5 h-3.5" /> Traduzir
          </button>
        )}
      </div>

      {compraPendente && (
        <div className="mb-4">
          <CompraGate servicoSlug="traducao-cv" servicoNome="Descarregar CV traduzido" onUnlock={() => { setCompraPendente(false); baixarDeFacto(); }}>
            {null}
          </CompraGate>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> A traduzir o teu CV...
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {resultado && !loading && (
          <div className="mt-1">
            <p className="text-xs text-gray-500 mb-3">Tradução pronta, nomes de empresas/instituições mantêm-se inalterados.</p>
            <button onClick={baixar} className="btn-vivid-outline text-xs px-4 py-2.5">
              {!ent.checking && !ent.unlocked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {!ent.checking && !ent.unlocked ? `Descarregar CV traduzido: ${ent.servico?.preco_mt ?? "..."} MT` : "Descarregar CV traduzido (.docx)"}
            </button>
          </div>
        )}
    </div>
  );
}
