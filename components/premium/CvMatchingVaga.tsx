"use client";
import { useState } from "react";
import { Target, Loader2, AlertTriangle, CheckCircle2, XCircle, Lightbulb, Download, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarTextoDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import CompraGate from "@/components/premium/CompraGate";
import BlocoBloqueado from "@/components/premium/BlocoBloqueado";

interface MatchResult {
  compatibilidade: number;
  competenciasEncontradas: string[];
  competenciasEmFalta: string[];
  sugestoes: string[];
}

function matchColor(v: number) {
  if (v >= 75) return "#D20001";
  if (v >= 45) return "#D20001";
  return "#FE0000";
}

export default function CvMatchingVaga({ cvData }: { cvData: Record<string, unknown> }) {
  const ent = useEntitlement("cv-matching-vaga");
  const [vagaTexto, setVagaTexto] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compraPendente, setCompraPendente] = useState(false);

  // Comparar é livre e imediato — a cobrança acontece ao descarregar o relatório completo.
  async function comparar() {
    if (!vagaTexto.trim() || vagaTexto.trim().length < 30) {
      setError("Cola o texto completo da vaga (requisitos, descrição) para uma comparação fiável.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/curriculum/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, vagaTexto }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro ao comparar.");
      else setResult(data);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function baixarDeFacto() {
    if (!result) return;
    const linhas = [
      `Compatibilidade com a vaga: ${result.compatibilidade}%`,
      "",
      "COMPETÊNCIAS ENCONTRADAS",
      ...result.competenciasEncontradas.map((c) => `- ${c}`),
      "",
      "COMPETÊNCIAS EM FALTA",
      ...result.competenciasEmFalta.map((c) => `- ${c}`),
      "",
      "COMO DESTACAR O QUE JÁ TENS",
      ...result.sugestoes.map((s, i) => `${i + 1}. ${s}`),
    ];
    const blob = await gerarTextoDocx("Relatório de Compatibilidade com Vaga", linhas.join("\n"));
    const nomeFicheiro = "CV_Match_Vaga.docx";
    downloadBlob(blob, nomeFicheiro);
    guardarDocumento("cv-matching-vaga", nomeFicheiro, blob);
  }

  function baixar() {
    if (ent.checking) return;
    if (!ent.unlocked) { setCompraPendente(true); return; }
    baixarDeFacto();
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{
        background: "linear-gradient(135deg, rgba(210,0,1,0.04) 0%, rgba(254,0,0,0.04) 100%)",
        border: "1px solid rgba(210,0,1,0.15)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #D20001, #FE0000)" }}>
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#2A0001]">CV Match com MUIANGA IA</h3>
          <p className="text-[11px] text-gray-400">Cola a descrição da vaga e compara com o teu CV</p>
        </div>
      </div>

      <textarea
        value={vagaTexto}
        onChange={(e) => setVagaTexto(e.target.value)}
        placeholder="Cola aqui o texto da vaga: requisitos, responsabilidades, competências pedidas..."
        rows={5}
        className="input-vivid mb-3 resize-none"
      />

      <button onClick={comparar} disabled={loading} className="btn-vivid text-xs px-4 py-2.5 disabled:opacity-60">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
        {result ? "Comparar novamente" : "Calcular Compatibilidade"}
      </button>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mt-4">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-6">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200/60">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl" style={{ background: `${matchColor(result.compatibilidade)}14` }}>
              <span className="text-xl font-extrabold" style={{ color: matchColor(result.compatibilidade) }}>{result.compatibilidade}%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#2A0001]">Compatibilidade com a vaga</p>
              <p className="text-xs text-gray-400">
                {result.compatibilidade >= 75 ? "Excelente correspondência, candidata-te com confiança." :
                 result.compatibilidade >= 45 ? "Boa base, reforça os pontos em falta se possível." :
                 "Compatibilidade baixa, considera vagas mais alinhadas ao teu perfil."}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Competências Encontradas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.competenciasEncontradas.map((c, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">{c}</span>
              ))}
              {result.competenciasEncontradas.length === 0 && <span className="text-[11px] text-gray-400">Nenhuma correspondência directa encontrada.</span>}
            </div>
          </div>

          <BlocoBloqueado
            unlocked={ent.unlocked}
            onDesbloquear={() => setCompraPendente(true)}
            precoMt={ent.servico?.preco_mt}
            minHeight={160}
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-pink-600 mb-2 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Em Falta
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.competenciasEmFalta.map((c, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 font-medium">{c}</span>
                  ))}
                  {result.competenciasEmFalta.length === 0 && <span className="text-[11px] text-gray-400">Nenhuma lacuna identificada.</span>}
                </div>
              </div>

              {result.sugestoes.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "rgba(254,0,0,0.06)", border: "1px solid rgba(254,0,0,0.18)" }}>
                  <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#9A0000" }}>
                    <Lightbulb className="w-3.5 h-3.5" /> Como destacar o que já tens
                  </p>
                  <ul className="space-y-1.5">
                    {result.sugestoes.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="font-bold shrink-0" style={{ color: "#FE0000" }}>{i + 1}.</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </BlocoBloqueado>

          <button onClick={baixar} className="btn-vivid-outline text-xs px-4 py-2.5 mt-2">
            {!ent.checking && !ent.unlocked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            {!ent.checking && !ent.unlocked ? `Descarregar relatório — ${ent.servico?.preco_mt ?? "..."} MT` : "Descarregar relatório (.docx)"}
          </button>
        </div>
      )}

      {compraPendente && (
        <div className="mt-4">
          <CompraGate servicoSlug="cv-matching-vaga" servicoNome="Descarregar relatório de compatibilidade" onUnlock={() => { setCompraPendente(false); baixarDeFacto(); }}>
            {null}
          </CompraGate>
        </div>
      )}
    </div>
  );
}
