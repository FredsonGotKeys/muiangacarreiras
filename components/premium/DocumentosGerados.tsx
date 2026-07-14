"use client";
import { useState } from "react";
import { Mail, FileSignature, Loader2, Copy, Check, Download, Building2, FileType2, Heart, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { gerarTextoDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import CompraGate from "@/components/premium/CompraGate";
import BlocoBloqueado from "@/components/premium/BlocoBloqueado";

type Doc = "carta" | "requerimento" | "motivacao";

const SLUG_POR_DOC: Record<Doc, string> = { carta: "carta-apresentacao", requerimento: "requerimento", motivacao: "carta-motivacao" };
const NOME_POR_DOC: Record<Doc, string> = { carta: "Carta de Apresentação", requerimento: "Requerimento", motivacao: "Carta de Motivação" };
const TIPO_DOCUMENTO_POR_DOC: Record<Doc, string> = { carta: "carta-apresentacao", requerimento: "requerimento", motivacao: "carta-motivacao" };
const ENDPOINT_POR_DOC: Record<Doc, string> = { carta: "/api/curriculum/carta", requerimento: "/api/curriculum/requerimento", motivacao: "/api/curriculum/carta-motivacao" };

/**
 * A geração de texto é livre e imediata (gatear isso só empurra o cliente a
 * melhorar o texto noutro lado e colar de volta — não impede nada). A
 * cobrança acontece nas acções que extraem o resultado final: copiar,
 * partilhar ou descarregar.
 */
export default function DocumentosGerados({ cvData }: { cvData: Record<string, unknown> }) {
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [editing, setEditing] = useState(false);
  const [compraPendente, setCompraPendente] = useState<Doc | null>(null);

  const cartaEnt = useEntitlement(SLUG_POR_DOC.carta);
  const requerimentoEnt = useEntitlement(SLUG_POR_DOC.requerimento);
  const motivacaoEnt = useEntitlement(SLUG_POR_DOC.motivacao);
  const entitlementPorDoc: Record<Doc, ReturnType<typeof useEntitlement>> = { carta: cartaEnt, requerimento: requerimentoEnt, motivacao: motivacaoEnt };

  async function gerar(doc: Doc) {
    setLoading(doc);
    setError(null);
    setActiveDoc(doc);
    setEditing(false);
    try {
      const res = await authFetch(ENDPOINT_POR_DOC[doc], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, empresa: empresa || undefined, cargo: cargo || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar documento.");
      } else {
        setTexto(data.carta ?? data.requerimento ?? "");
      }
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(null);
    }
  }

  /** Corre `acao` só se o utilizador tiver direito ao documento activo; senão mostra o gate de compra. */
  function comAutorizacao(acao: () => void) {
    if (!activeDoc) return;
    const ent = entitlementPorDoc[activeDoc];
    if (ent.checking) return;
    if (!ent.unlocked) { setCompraPendente(activeDoc); return; }
    acao();
  }

  function copiar() {
    comAutorizacao(() => {
      navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function baixarWord() {
    comAutorizacao(async () => {
      if (!activeDoc) return;
      const titulo = NOME_POR_DOC[activeDoc];
      const nomeFicheiro = `${titulo.replace(/\s+/g, "_")}.docx`;
      const blob = await gerarTextoDocx(titulo, texto);
      downloadBlob(blob, nomeFicheiro);
      guardarDocumento(TIPO_DOCUMENTO_POR_DOC[activeDoc], nomeFicheiro, blob);
    });
  }

  function imprimir() {
    comAutorizacao(() => {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`
        <html><head><title>${activeDoc ? NOME_POR_DOC[activeDoc] : ""}</title>
        <style>
          body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.7; padding: 25mm 22mm; white-space: pre-wrap; color: #111; }
          @page { size: A4; margin: 0; }
        </style></head>
        <body>${texto.replace(/</g, "&lt;")}</body></html>
      `);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    });
  }

  function partilhar(destino: "whatsapp" | "email") {
    comAutorizacao(() => {
      const url = destino === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(texto)}`
        : `mailto:?subject=${encodeURIComponent(activeDoc ? NOME_POR_DOC[activeDoc] : "")}&body=${encodeURIComponent(texto)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 print:hidden"
      style={{
        background: "linear-gradient(135deg, rgba(237,29,29,0.04) 0%, rgba(254,0,0,0.04) 100%)",
        border: "1px solid rgba(237,29,29,0.15)",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #ED1D1D, #FE0000)" }}
        >
          <FileSignature className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#2A0001]">Cartas & Requerimento</h3>
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
        <button onClick={() => gerar("motivacao")} disabled={loading !== null} className="btn-vivid-outline text-xs px-4 py-2.5 disabled:opacity-60">
          {loading === "motivacao" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className="w-3.5 h-3.5" />}
          {texto && activeDoc === "motivacao" ? "Regenerar Carta de Motivação" : "Gerar Carta de Motivação"}
        </button>
      </div>

      {compraPendente && (
        <div className="mb-5">
          <CompraGate
            servicoSlug={SLUG_POR_DOC[compraPendente]}
            servicoNome={`Descarregar ${NOME_POR_DOC[compraPendente]}`}
            onUnlock={() => setCompraPendente(null)}
          >
            {null}
          </CompraGate>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 mb-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {texto && !loading && (
          <div
          >
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-xs font-semibold text-gray-500">
                {activeDoc ? NOME_POR_DOC[activeDoc] : ""}
              </span>
              <div className="flex items-center gap-2">
                {activeDoc && !entitlementPorDoc[activeDoc].checking && !entitlementPorDoc[activeDoc].unlocked && (
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {entitlementPorDoc[activeDoc].servico?.preco_mt ?? "..."} MT para copiar/descarregar
                  </span>
                )}
                {activeDoc && entitlementPorDoc[activeDoc].unlocked && (
                  <button onClick={() => setEditing(!editing)} className="text-[11px] font-semibold text-gray-400 hover:text-[#ED1D1D] transition-colors">
                    {editing ? "Concluir edição" : "Editar"}
                  </button>
                )}
                <button onClick={copiar} className="text-[11px] font-semibold text-gray-400 hover:text-[#ED1D1D] transition-colors flex items-center gap-1">
                  {copiado ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiado ? "Copiado" : "Copiar"}
                </button>
                <button onClick={imprimir} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#ED1D1D" }}>
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button onClick={baixarWord} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#FE0000" }}>
                  <FileType2 className="w-3 h-3" /> Word
                </button>
              </div>
            </div>

            {/* Partilha rápida */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => partilhar("whatsapp")}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                WhatsApp
              </button>
              <button
                onClick={() => partilhar("email")}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3 h-3" /> Email
              </button>
            </div>

            {editing ? (
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={14}
                className="w-full text-sm leading-relaxed border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-[#ED1D1D] focus:ring-2 focus:ring-[#ED1D1D]/10 transition-all"
                style={{ fontFamily: "Georgia, serif" }}
              />
            ) : (
              <div
                className="bg-white border border-gray-100 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap text-gray-700"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {texto.slice(0, 140)}
                {texto.length > 140 && "…"}
                {texto.length > 140 && (
                  <div className="mt-2">
                    <BlocoBloqueado
                      unlocked={!!activeDoc && entitlementPorDoc[activeDoc].unlocked}
                      onDesbloquear={() => activeDoc && setCompraPendente(activeDoc)}
                      precoMt={activeDoc ? entitlementPorDoc[activeDoc].servico?.preco_mt : undefined}
                      minHeight={120}
                    >
                      <div className="whitespace-pre-wrap">{texto.slice(140)}</div>
                    </BlocoBloqueado>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {!texto && !loading && (
        <p className="text-xs text-gray-400">
          Indica a empresa e o cargo (opcional) para uma carta personalizada, ou gera directamente uma versão genérica de alta qualidade.
        </p>
      )}
    </div>
  );
}
