"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, FileSignature, Loader2, Copy, Check, Download, Building2, FileType2 } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarTextoDocx, downloadBlob } from "@/lib/export-docx";

type Doc = "carta" | "requerimento";

export default function DocumentosGerados({ cvData }: { cvData: Record<string, unknown> }) {
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [editing, setEditing] = useState(false);

  async function gerar(doc: Doc) {
    setLoading(doc);
    setError(null);
    setActiveDoc(doc);
    setEditing(false);
    try {
      const endpoint = doc === "carta" ? "/api/curriculum/carta" : "/api/curriculum/requerimento";
      const res = await authFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, empresa: empresa || undefined, cargo: cargo || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar documento.");
      } else {
        setTexto(doc === "carta" ? data.carta : data.requerimento);
      }
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(null);
    }
  }

  function copiar() {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function baixarWord() {
    if (!activeDoc) return;
    const titulo = activeDoc === "carta" ? "Carta de Apresentação" : "Requerimento de Emprego";
    const blob = await gerarTextoDocx(titulo, texto);
    downloadBlob(blob, `${activeDoc === "carta" ? "Carta_Apresentacao" : "Requerimento"}.docx`);
  }

  function imprimir() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>${activeDoc === "carta" ? "Carta de Apresentação" : "Requerimento"}</title>
      <style>
        body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.7; padding: 25mm 22mm; white-space: pre-wrap; color: #111; }
        @page { size: A4; margin: 0; }
      </style></head>
      <body>${texto.replace(/</g, "&lt;")}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(236,72,153,0.04) 100%)",
        border: "1px solid rgba(139,92,246,0.15)",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #EC4899)" }}
        >
          <FileSignature className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0D0D0D]">Carta de Apresentação & Requerimento</h3>
          <p className="text-[11px] text-gray-400">Gerados automaticamente a partir do teu CV</p>
        </div>
      </div>

      {/* Contexto opcional da vaga */}
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div className="relative">
          <Building2 className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Empresa (opcional)"
            className="input-vivid pl-9"
          />
        </div>
        <input
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          placeholder="Cargo pretendido (opcional)"
          className="input-vivid"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => gerar("carta")} disabled={loading !== null} className="btn-vivid text-xs px-4 py-2.5 disabled:opacity-60">
          {loading === "carta" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          {texto && activeDoc === "carta" ? "Regenerar Carta" : "Gerar Carta de Apresentação"}
        </button>
        <button onClick={() => gerar("requerimento")} disabled={loading !== null} className="btn-vivid-outline text-xs px-4 py-2.5 disabled:opacity-60">
          {loading === "requerimento" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />}
          {texto && activeDoc === "requerimento" ? "Regenerar Requerimento" : "Gerar Requerimento"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mb-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {texto && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">
                {activeDoc === "carta" ? "Carta de Apresentação" : "Requerimento de Emprego"}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(!editing)} className="text-[11px] font-semibold text-gray-400 hover:text-[#8B5CF6] transition-colors">
                  {editing ? "Concluir edição" : "Editar"}
                </button>
                <button onClick={copiar} className="text-[11px] font-semibold text-gray-400 hover:text-[#8B5CF6] transition-colors flex items-center gap-1">
                  {copiado ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiado ? "Copiado" : "Copiar"}
                </button>
                <button onClick={imprimir} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#8B5CF6" }}>
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button onClick={baixarWord} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#06B6D4" }}>
                  <FileType2 className="w-3 h-3" /> Word
                </button>
              </div>
            </div>

            {/* Partilha rápida */}
            <div className="flex items-center gap-2 mb-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(activeDoc === "carta" ? "Carta de Apresentação" : "Requerimento de Emprego")}&body=${encodeURIComponent(texto)}`}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3 h-3" /> Email
              </a>
            </div>

            {editing ? (
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={14}
                className="w-full text-sm leading-relaxed border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
                style={{ fontFamily: "Georgia, serif" }}
              />
            ) : (
              <div
                className="bg-white border border-gray-100 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap text-gray-700"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {texto}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!texto && !loading && (
        <p className="text-xs text-gray-400">
          Indica a empresa e o cargo (opcional) para uma carta personalizada, ou gera directamente uma versão genérica de alta qualidade.
        </p>
      )}
    </div>
  );
}
