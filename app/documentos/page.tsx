"use client";
import { useState } from "react";
import {
  FileText, Briefcase, ClipboardList, ScrollText,
  Loader2, Copy, Check, Download, FileType2, Mail, Lock, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import { gerarTextoDocx, downloadBlob } from "@/lib/export-docx";
import { guardarDocumento } from "@/lib/documentos-client";
import { useEntitlement } from "@/lib/use-entitlement";
import { CATEGORIAS, TIPOS_DOCUMENTO, type CategoriaDocumento } from "@/lib/documentos-tipos";
import AuthModal from "@/components/AuthModal";
import CompraGate from "@/components/premium/CompraGate";
import BlocoBloqueado from "@/components/premium/BlocoBloqueado";

const ICONE_CATEGORIA: Record<CategoriaDocumento, typeof Briefcase> = {
  emprego: Briefcase,
  requerimentos: ClipboardList,
  declaracoes: ScrollText,
};

export default function DocumentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={24} /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8F8] flex items-center justify-center px-4 pt-20">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-[#D20001]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <FileText size={22} className="text-[#D20001]" />
          </div>
          <h1 className="text-xl font-bold text-[#2A0001] mb-2">Inicia sessão</h1>
          <p className="text-sm text-gray-400 mb-6">Para criares cartas, requerimentos e declarações.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary w-full justify-center">Entrar →</button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      </div>
    );
  }

  return <DocumentosConteudo nomeUser={(user.user_metadata?.nome as string | undefined) || user.email?.split("@")[0] || ""} />;
}

function DocumentosConteudo({ nomeUser }: { nomeUser: string }) {
  const [categoria, setCategoria] = useState<CategoriaDocumento>("emprego");
  const [tipoSlug, setTipoSlug] = useState<string | null>(null);
  const [nome, setNome] = useState(nomeUser);
  const [bi, setBi] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [naturalidade, setNaturalidade] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [morada, setMorada] = useState("");
  const [contacto, setContacto] = useState("");
  const [entidade, setEntidade] = useState("");
  const [segundaPessoaNome, setSegundaPessoaNome] = useState("");
  const [segundaPessoaBi, setSegundaPessoaBi] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [compraPendente, setCompraPendente] = useState(false);

  const tipo = TIPOS_DOCUMENTO.find((t) => t.slug === tipoSlug) ?? null;
  const ent = useEntitlement(tipo?.servicoSlug ?? "");

  function escolher(slug: string) {
    setTipoSlug(slug);
    setTexto("");
    setError(null);
    setCompraPendente(false);
  }

  async function gerar() {
    if (!tipo) return;
    if (!nome.trim()) { setError("Indica o teu nome completo."); return; }
    if (!detalhes.trim()) { setError("Descreve os detalhes do pedido."); return; }
    if (tipo.precisaEntidade && !entidade.trim()) { setError(`Indica ${(tipo.labelEntidade ?? "a entidade").toLowerCase()}.`); return; }
    if (tipo.precisaSegundaPessoa && !segundaPessoaNome.trim()) { setError("Indica o nome da segunda pessoa envolvida."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/documentos/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipo.slug, nome, bi, dataNascimento, naturalidade, estadoCivil, morada, contacto,
          entidade, segundaPessoaNome, segundaPessoaBi, detalhes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao gerar documento."); return; }
      setTexto(data.texto ?? "");
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  function comAutorizacao(acao: () => void) {
    if (ent.checking) return;
    if (!ent.unlocked) { setCompraPendente(true); return; }
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
      if (!tipo) return;
      const nomeFicheiro = `${tipo.titulo.replace(/\s+/g, "_")}.docx`;
      const blob = await gerarTextoDocx(tipo.titulo, texto);
      downloadBlob(blob, nomeFicheiro);
      guardarDocumento(tipo.slug, nomeFicheiro, blob);
    });
  }

  function imprimir() {
    comAutorizacao(() => {
      const w = window.open("", "_blank");
      if (!w || !tipo) return;
      w.document.write(`
        <html><head><title>${tipo.titulo}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.7; padding: 25mm 22mm; white-space: pre-wrap; color: #111; }
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
        : `mailto:?subject=${encodeURIComponent(tipo?.titulo ?? "")}&body=${encodeURIComponent(texto)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  const tiposDaCategoria = TIPOS_DOCUMENTO.filter((t) => t.categoria === categoria);

  return (
    <div className="min-h-screen bg-[#FFF8F8] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/10 text-[#D20001] border border-[#D20001]/20 mb-3">
            Documentos
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2A0001] mb-1">Cartas, requerimentos e declarações</h1>
          <p className="text-gray-400 text-sm max-w-xl">Escolhe o documento, preenche os detalhes e gera de graça. Só pagas 200 MT quando fores copiar, descarregar ou partilhar.</p>
        </div>

        {/* Categorias */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {CATEGORIAS.map((c) => {
            const Icon = ICONE_CATEGORIA[c.id];
            const active = categoria === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setCategoria(c.id); setTipoSlug(null); setTexto(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-[#D20001] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-100 hover:border-[#D20001]/30"}`}
              >
                <Icon className="w-4 h-4" /> {c.label}
              </button>
            );
          })}
        </div>

        {/* Lista de tipos da categoria */}
        {!tipo && (
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {tiposDaCategoria.map((t) => (
              <button
                key={t.slug}
                onClick={() => escolher(t.slug)}
                className="service-card group text-left"
              >
                <h3 className="font-bold text-sm text-[#2A0001] group-hover:text-[#D20001] transition-colors">{t.titulo}</h3>
                <p className="text-gray-400 text-xs leading-relaxed flex-1">{t.descricaoCurta}</p>
                <div className="flex items-center justify-end mt-auto pt-2">
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#D20001] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Formulário + resultado do tipo escolhido */}
        {tipo && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-7">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-base text-[#2A0001]">{tipo.titulo}</h2>
                <p className="text-xs text-gray-400">{tipo.descricaoCurta}</p>
              </div>
              <button onClick={() => escolher("")} className="text-xs font-semibold text-gray-400 hover:text-[#D20001] transition-colors">
                ← Escolher outro
              </button>
            </div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Os teus dados (como no Bilhete de Identidade)</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="input-vivid" />
              <input value={bi} onChange={(e) => setBi(e.target.value)} placeholder="Nº do Bilhete de Identidade" className="input-vivid" />
              <input value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} placeholder="Data de nascimento" className="input-vivid" />
              <input value={naturalidade} onChange={(e) => setNaturalidade(e.target.value)} placeholder="Naturalidade (local de nascimento)" className="input-vivid" />
              <input value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} placeholder="Estado civil" className="input-vivid" />
              <input value={morada} onChange={(e) => setMorada(e.target.value)} placeholder="Morada/Residência" className="input-vivid" />
              <input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Contacto (telefone ou email, opcional)" className="input-vivid sm:col-span-2" />
            </div>

            {(tipo.precisaEntidade || tipo.precisaSegundaPessoa) && (
              <>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dados adicionais</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  {tipo.precisaEntidade && (
                    <input
                      value={entidade}
                      onChange={(e) => setEntidade(e.target.value)}
                      placeholder={tipo.labelEntidade ?? "Entidade"}
                      className="input-vivid sm:col-span-2"
                    />
                  )}
                  {tipo.precisaSegundaPessoa && (
                    <>
                      <input value={segundaPessoaNome} onChange={(e) => setSegundaPessoaNome(e.target.value)} placeholder="Nome completo da segunda pessoa" className="input-vivid" />
                      <input value={segundaPessoaBi} onChange={(e) => setSegundaPessoaBi(e.target.value)} placeholder="Nº do BI da segunda pessoa" className="input-vivid" />
                    </>
                  )}
                </div>
              </>
            )}

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detalhes do pedido</p>
            <textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Motivo, datas, e qualquer informação específica deste documento..."
              rows={4}
              className="input-vivid w-full mb-4 resize-none"
            />

            {!loading && (
              <button onClick={gerar} className="btn-vivid text-xs px-4 py-2.5 mb-4">
                <FileText className="w-3.5 h-3.5" /> {texto ? "Regenerar" : "Gerar documento"}
              </button>
            )}

            {compraPendente && (
              <div className="mb-4">
                <CompraGate servicoSlug={tipo.servicoSlug} servicoNome={`Descarregar ${tipo.titulo}`} onUnlock={() => setCompraPendente(false)}>
                  {null}
                </CompraGate>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> A gerar o documento...
              </div>
            )}

            {error && <p className="text-xs text-red-600 mt-2 mb-3">{error}</p>}

            {texto && !loading && (
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-xs font-semibold text-gray-500">{tipo.titulo}</span>
                  <div className="flex items-center gap-2">
                    {!ent.checking && !ent.unlocked && (
                      <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {ent.servico?.preco_mt ?? "..."} MT para copiar/descarregar
                      </span>
                    )}
                    <button onClick={copiar} className="text-[11px] font-semibold text-gray-400 hover:text-[#D20001] transition-colors flex items-center gap-1">
                      {copiado ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiado ? "Copiado" : "Copiar"}
                    </button>
                    <button onClick={imprimir} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#D20001" }}>
                      <Download className="w-3 h-3" /> PDF
                    </button>
                    <button onClick={baixarWord} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#FE0000" }}>
                      <FileType2 className="w-3 h-3" /> Word
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => partilhar("whatsapp")} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                    WhatsApp
                  </button>
                  <button onClick={() => partilhar("email")} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email
                  </button>
                </div>

                <div
                  className="bg-[#FFF8F8] border border-gray-100 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap text-gray-700"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  {texto.slice(0, 140)}
                  {texto.length > 140 && "…"}
                  {texto.length > 140 && (
                    <div className="mt-2">
                      <BlocoBloqueado
                        unlocked={ent.unlocked}
                        onDesbloquear={() => setCompraPendente(true)}
                        precoMt={ent.servico?.preco_mt}
                        minHeight={120}
                      >
                        <div className="whitespace-pre-wrap">{texto.slice(140)}</div>
                      </BlocoBloqueado>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
