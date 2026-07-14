"use client";
import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw, Download, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarTextoDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import CompraGate from "@/components/premium/CompraGate";
import BlocoBloqueado from "@/components/premium/BlocoBloqueado";

interface Categoria { nome: string; pontuacao: number; comentario: string; }
interface AnaliseResult {
  pontuacaoGeral: number;
  categorias: Categoria[];
  pontosFortes: string[];
  pontosFracos: string[];
  recomendacoes: string[];
}

function scoreColor(score: number) {
  if (score >= 80) return "#D20001"; // bom
  if (score >= 60) return "#F4B740"; // médio
  return "#C81E5C"; // precisa de atenção
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circ = 2 * Math.PI * radius;
  const color = scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F1F1" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={8} fill="none" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color, fontFamily: "var(--font-display)" }}>{score}</span>
        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

function CategoryBar({ cat, delay }: { cat: Categoria; delay: number }) {
  const color = scoreColor(cat.pontuacao);
  return (
    <div
      className="mb-3.5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#2A0001]">{cat.nome}</span>
        <span className="text-xs font-bold" style={{ color }}>{cat.pontuacao}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ background: color, width: `${cat.pontuacao}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1 leading-snug">{cat.comentario}</p>
    </div>
  );
}

export default function CvAnaliseIA({ cvData }: { cvData: Record<string, unknown> }) {
  const ent = useEntitlement("analise-cv");
  const [result, setResult] = useState<AnaliseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compraPendente, setCompraPendente] = useState(false);

  // Analisar é livre e imediato — a cobrança acontece ao descarregar o relatório.
  async function analisar() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/curriculum/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao analisar o CV.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function baixarDeFacto() {
    if (!result) return;
    const linhas = [
      `Pontuação geral: ${result.pontuacaoGeral}/100`,
      "",
      "CATEGORIAS",
      ...result.categorias.map((c) => `- ${c.nome}: ${c.pontuacao}/100, ${c.comentario}`),
      "",
      "PONTOS FORTES",
      ...result.pontosFortes.map((p) => `- ${p}`),
      "",
      "PONTOS A MELHORAR",
      ...result.pontosFracos.map((p) => `- ${p}`),
      "",
      "RECOMENDAÇÕES",
      ...result.recomendacoes.map((r, i) => `${i + 1}. ${r}`),
    ];
    const blob = await gerarTextoDocx("Relatório de Análise do CV", linhas.join("\n"));
    const nomeFicheiro = "Relatorio_Analise_CV.docx";
    downloadBlob(blob, nomeFicheiro);
    guardarDocumento("analise-cv", nomeFicheiro, blob);
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
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #D20001, #FE0000)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2A0001]">Análise Inteligente do CV</h3>
            <p className="text-[11px] text-gray-400">Consultor de carreira virtual, Muianga Carreiras</p>
          </div>
        </div>

        {!loading && (
          <button
            onClick={analisar}
            className="btn-vivid text-xs px-4 py-2.5"
          >
            {result ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {result ? "Reanalisar" : "Analisar CV"}
          </button>
        )}
      </div>

      {loading && (
          <div
            key="loading"
            className="flex flex-col items-center justify-center gap-3 py-10"
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#D20001" }} />
            <p className="text-xs text-gray-400">A analisar o teu currículo com critérios de recrutamento reais...</p>
          </div>
        )}

        {error && !loading && (
          <div
            key="error"
            className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mt-3"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div
            key="result"
            className="mt-5"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-gray-200/60">
              <ScoreRing score={result.pontuacaoGeral} size={110} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-[#2A0001] mb-1">Pontuação Geral do Currículo</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {result.pontuacaoGeral >= 80
                    ? "Excelente! O teu CV está bem preparado para candidaturas."
                    : result.pontuacaoGeral >= 60
                    ? "Bom ponto de partida, há espaço para melhorias importantes."
                    : "Recomendamos reforçar várias secções antes de candidatar-te."}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 mb-6">
              {result.categorias.map((cat, i) => (
                <CategoryBar key={cat.nome} cat={cat} delay={0.1 + i * 0.06} />
              ))}
            </div>

            <BlocoBloqueado
              unlocked={ent.unlocked}
              onDesbloquear={() => setCompraPendente(true)}
              precoMt={ent.servico?.preco_mt}
              minHeight={160}
            >
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {result.pontosFortes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pontos Fortes
                    </p>
                    <ul className="space-y-1.5">
                      {result.pontosFortes.map((p, i) => (
                        <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.pontosFracos.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-pink-600 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pontos a Melhorar
                    </p>
                    <ul className="space-y-1.5">
                      {result.pontosFracos.map((p, i) => (
                        <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-pink-500 mt-0.5">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </BlocoBloqueado>

            {result.recomendacoes.length > 0 && (
              <BlocoBloqueado
                unlocked={ent.unlocked}
                onDesbloquear={() => setCompraPendente(true)}
                precoMt={ent.servico?.preco_mt}
                minHeight={120}
              >
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(254,0,0,0.06)", border: "1px solid rgba(254,0,0,0.18)" }}
                >
                  <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#9A0000" }}>
                    <TrendingUp className="w-3.5 h-3.5" /> Recomendações do MUIANGA IA
                  </p>
                  <ul className="space-y-1.5">
                    {result.recomendacoes.map((r, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="font-bold shrink-0" style={{ color: "#FE0000" }}>{i + 1}.</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </BlocoBloqueado>
            )}

            <button onClick={baixar} className="btn-vivid-outline text-xs px-4 py-2.5 mt-4">
              {!ent.checking && !ent.unlocked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {!ent.checking && !ent.unlocked ? `Descarregar relatório: ${ent.servico?.preco_mt ?? "..."} MT` : "Descarregar relatório (.docx)"}
            </button>
          </div>
        )}

      {compraPendente && (
        <div className="mt-4">
          <CompraGate servicoSlug="analise-cv" servicoNome="Descarregar Relatório de Análise" onUnlock={() => { setCompraPendente(false); baixarDeFacto(); }}>
            {null}
          </CompraGate>
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-xs text-gray-400 mt-2">
          Obtém uma auditoria completa do teu CV: compatibilidade ATS, ortografia, layout, experiência e mais. Pontuação baseada em critérios reais de recrutamento usados em Moçambique.
        </p>
      )}
    </div>
  );
}
