"use client";
import { useState } from "react";
import { FileCheck2, ListChecks, LayoutTemplate, Loader2, Download, Copy, Check, AlertTriangle } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { downloadBlob } from "@/lib/export-docx";

type Tool = "revisao" | "normalizar" | "formatar";

const TOOLS: { id: Tool; label: string; Icon: typeof FileCheck2 }[] = [
  { id: "revisao",    label: "Revisão Científica", Icon: FileCheck2 },
  { id: "normalizar", label: "Normalização de Referências", Icon: ListChecks },
  { id: "formatar",   label: "Formatação Académica", Icon: LayoutTemplate },
];

export default function FerramentasAcademicasPage() {
  const [tool, setTool] = useState<Tool>("revisao");

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2A0001]" style={{ fontFamily: "var(--font-display)" }}>Ferramentas Académicas</h1>
          <p className="text-sm text-gray-400 mt-1">Já tens o texto escrito? Usa estas ferramentas de apoio.</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tool === t.id ? "bg-[#D20001] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}
            >
              <t.Icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tool === "revisao" && <RevisaoTool />}
        {tool === "normalizar" && <NormalizarTool />}
        {tool === "formatar" && <FormatarTool />}
      </div>
    </main>
  );
}

function RevisaoTool() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<{ textoCorrigido: string; alteracoes: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function rever() {
    setLoading(true); setError(null); setResultado(null);
    try {
      const res = await authFetch("/api/academico/revisao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao rever.");
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={10} placeholder="Cola aqui o texto a rever..." className="input-field resize-none" />
      <button onClick={rever} disabled={loading || !texto.trim()} className="btn-primary text-sm disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />} Rever texto
      </button>
      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600"><AlertTriangle className="w-4 h-4" />{error}</div>}
      {resultado && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase">Texto corrigido</p>
            <button onClick={() => { navigator.clipboard.writeText(resultado.textoCorrigido); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }} className="text-xs text-[#D20001] font-semibold flex items-center gap-1">
              {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{resultado.textoCorrigido}</div>
          {resultado.alteracoes?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Alterações feitas</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                {resultado.alteracoes.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NormalizarTool() {
  const [referencias, setReferencias] = useState("");
  const [norma, setNorma] = useState<"APA" | "Vancouver" | "Harvard">("APA");
  const [resultado, setResultado] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function normalizar() {
    setLoading(true); setError(null); setResultado(null);
    try {
      const res = await authFetch("/api/academico/normalizar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ referencias, norma }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data.referenciasNormalizadas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao normalizar.");
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <div className="flex gap-2">
        {(["APA", "Vancouver", "Harvard"] as const).map(n => (
          <button key={n} onClick={() => setNorma(n)} className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${norma === n ? "border-[#D20001] bg-[#D20001]/10 text-[#D20001]" : "border-gray-200 text-gray-500"}`}>{n}</button>
        ))}
      </div>
      <textarea value={referencias} onChange={e => setReferencias(e.target.value)} rows={8} placeholder="Cola aqui as tuas referências, uma por linha..." className="input-field resize-none" />
      <button onClick={normalizar} disabled={loading || !referencias.trim()} className="btn-primary text-sm disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />} Normalizar para {norma}
      </button>
      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600"><AlertTriangle className="w-4 h-4" />{error}</div>}
      {resultado && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {resultado.map((r, i) => <p key={i} className="text-sm text-gray-700">{r}</p>)}
        </div>
      )}
    </div>
  );
}

function FormatarTool() {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  async function formatar() {
    setLoading(true); setError(null); setPronto(false);
    try {
      const res = await authFetch("/api/academico/formatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo, texto }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Erro ao formatar."); }
      const blob = await res.blob();
      downloadBlob(blob, `${(titulo || "documento").slice(0, 50).replace(/[^\w\s-]/g, "").trim() || "documento"}.docx`);
      setPronto(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao formatar.");
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do trabalho" className="input-field" />
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={12} placeholder={"Cola aqui o teu texto.\nUsa \"# \" no início da linha para criar um título de secção (ex: # Introdução)."} className="input-field resize-none font-mono text-xs" />
      <p className="text-[11px] text-gray-400">Dica: linhas começadas com <code className="bg-gray-100 px-1 rounded">#</code> viram títulos e aparecem no índice automático.</p>
      <button onClick={formatar} disabled={loading || !texto.trim()} className="btn-primary text-sm disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Gerar .docx formatado
      </button>
      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600"><AlertTriangle className="w-4 h-4" />{error}</div>}
      {pronto && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700"><Check className="w-4 h-4" />Documento descarregado!</div>}
    </div>
  );
}
