"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface Categoria { nome: string; pontuacao: number; comentario: string; }
interface AnaliseResult {
  pontuacaoGeral: number;
  categorias: Categoria[];
  pontosFortes: string[];
  pontosFracos: string[];
  recomendacoes: string[];
}

function scoreColor(score: number) {
  if (score >= 80) return "#10B981"; // emerald
  if (score >= 60) return "#FF6B35"; // orange
  return "#EC4899"; // pink — precisa de atenção
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circ = 2 * Math.PI * radius;
  const color = scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F1F1" strokeWidth={8} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={8} fill="none" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
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
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="mb-3.5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#0D0D0D]">{cat.nome}</span>
        <span className="text-xs font-bold" style={{ color }}>{cat.pontuacao}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${cat.pontuacao}%` }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1 leading-snug">{cat.comentario}</p>
    </motion.div>
  );
}

export default function CvAnaliseIA({ cvData }: { cvData: Record<string, unknown> }) {
  const [result, setResult] = useState<AnaliseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,107,53,0.04) 0%, rgba(6,182,212,0.04) 100%)",
        border: "1px solid rgba(255,107,53,0.15)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #FF6B35, #EC4899)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0D0D0D]">Análise Inteligente do CV</h3>
            <p className="text-[11px] text-gray-400">Consultor de carreira virtual — Muianga Carreiras</p>
          </div>
        </div>

        {!loading && (
          <button
            onClick={analisar}
            className="btn-vivid text-xs px-4 py-2.5"
          >
            {result ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {result ? "Reanalisar" : "Analisar com IA"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 py-10"
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#FF6B35" }} />
            <p className="text-xs text-gray-400">A analisar o teu currículo com critérios de recrutamento reais...</p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mt-3"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-gray-200/60">
              <ScoreRing score={result.pontuacaoGeral} size={110} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-[#0D0D0D] mb-1">Pontuação Geral do Currículo</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {result.pontuacaoGeral >= 80
                    ? "Excelente! O teu CV está bem preparado para candidaturas."
                    : result.pontuacaoGeral >= 60
                    ? "Bom ponto de partida — há espaço para melhorias importantes."
                    : "Recomendamos reforçar várias secções antes de candidatar-te."}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 mb-6">
              {result.categorias.map((cat, i) => (
                <CategoryBar key={cat.nome} cat={cat} delay={0.1 + i * 0.06} />
              ))}
            </div>

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

            {result.recomendacoes.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.18)" }}
              >
                <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#0891B2" }}>
                  <TrendingUp className="w-3.5 h-3.5" /> Recomendações do Consultor IA
                </p>
                <ul className="space-y-1.5">
                  {result.recomendacoes.map((r, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="font-bold shrink-0" style={{ color: "#06B6D4" }}>{i + 1}.</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && !error && (
        <p className="text-xs text-gray-400 mt-2">
          Obtém uma auditoria completa do teu CV — compatibilidade ATS, ortografia, layout, experiência e mais. Pontuação baseada em critérios reais de recrutamento usados em Moçambique.
        </p>
      )}
    </div>
  );
}
