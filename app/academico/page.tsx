"use client";
import { useState, useRef, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles, ChevronRight, ChevronLeft, Loader2, Download,
  Image as ImageIcon, X, CheckCircle2, AlertTriangle, FileText,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { downloadBlob } from "@/lib/export-docx";
import {
  NIVEIS, SECOES, defaultSecoesForNivel,
  type NivelAcademico, type SecaoId,
} from "@/lib/academico-sections";

const STEPS = ["Informações", "Estrutura", "Personalização", "Pré-visualização", "Gerar", "Download"];

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface FormState {
  tema: string; area: string; nivel: NivelAcademico; paginas: string;
  instituicao: string; faculdade: string; curso: string; disciplina: string;
  docente: string; orientador: string; autores: string; numerosEstudante: string;
  cidade: string; ano: string;
}

const emptyForm: FormState = {
  tema: "", area: "", nivel: "licenciatura", paginas: "",
  instituicao: "", faculdade: "", curso: "", disciplina: "",
  docente: "", orientador: "", autores: "", numerosEstudante: "",
  cidade: "Maputo", ano: String(new Date().getFullYear()),
};

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="label-xs mb-1.5 block">{label}{required && <span className="text-red-400"> *</span>}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}

export default function AcademicoPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [secoes, setSecoes] = useState<Set<SecaoId>>(() => defaultSecoesForNivel(emptyForm.nivel));
  const [mostrarLogo, setMostrarLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

  // Ao mudar de nível, reaplica a predefinição de secções (o utilizador pode sempre ajustar depois)
  useEffect(() => {
    setSecoes(defaultSecoesForNivel(form.nivel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.nivel]);

  function toggleSecao(id: SecaoId) {
    setSecoes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function gerarDocumento() {
    setGerando(true);
    setErro(null);
    try {
      const fd = new FormData();
      fd.append("dados", JSON.stringify({
        ...form,
        mostrarLogo,
        secoes: Array.from(secoes),
      }));
      if (logoFile && mostrarLogo) fd.append("logo", logoFile);

      const res = await authFetch("/api/academico/gerar", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao gerar o documento.");
      }
      const blob = await res.blob();
      setDocBlob(blob);
      setStep(5);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar o documento.");
    } finally {
      setGerando(false);
    }
  }

  function baixar() {
    if (!docBlob) return;
    const nomeFicheiro = (form.tema || "trabalho-academico").slice(0, 60).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
    downloadBlob(docBlob, `${nomeFicheiro || "trabalho-academico"}.docx`);
  }

  const podeAvancarStep0 = form.tema.trim().length > 0;

  const secoesPorGrupo = {
    preliminar: SECOES.filter(s => s.grupo === "preliminar"),
    corpo: SECOES.filter(s => s.grupo === "corpo"),
    final: SECOES.filter(s => s.grupo === "final"),
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> ASSISTENTE ACADÉMICO IA
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]" style={{ fontFamily: "var(--font-display)" }}>
            Cria o teu trabalho académico
          </h1>
          <p className="text-sm text-gray-400 mt-1">Estrutura, formatação e conteúdo — tudo automatizado</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => { if (i <= step || docBlob) setStep(i); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                i === step ? "bg-[#C9A84C] text-white" : i < step ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* STEP 0 — Informações */}
        {step === 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
            <Field label="Tema do trabalho" required value={form.tema} onChange={(v) => set("tema", v)} placeholder="Ex: Impacto do M-Pesa na inclusão financeira em Moçambique" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Área" value={form.area} onChange={(v) => set("area", v)} placeholder="Ex: Economia, Gestão, Engenharia..." />
              <div>
                <label className="label-xs mb-1.5 block">Nível académico</label>
                <select value={form.nivel} onChange={(e) => set("nivel", e.target.value as NivelAcademico)} className="input-field">
                  {NIVEIS.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Quantidade aproximada de páginas" value={form.paginas} onChange={(v) => set("paginas", v)} placeholder="Ex: 40" />
              <Field label="Ano" value={form.ano} onChange={(v) => set("ano", v)} />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Identificação institucional (opcional)</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Instituição" value={form.instituicao} onChange={(v) => set("instituicao", v)} />
                <Field label="Faculdade" value={form.faculdade} onChange={(v) => set("faculdade", v)} />
                <Field label="Curso" value={form.curso} onChange={(v) => set("curso", v)} />
                <Field label="Disciplina" value={form.disciplina} onChange={(v) => set("disciplina", v)} />
                <Field label="Docente" value={form.docente} onChange={(v) => set("docente", v)} />
                <Field label="Orientador" value={form.orientador} onChange={(v) => set("orientador", v)} />
                <Field label="Autor(es)" value={form.autores} onChange={(v) => set("autores", v)} />
                <Field label="Número(s) de estudante" value={form.numerosEstudante} onChange={(v) => set("numerosEstudante", v)} />
                <Field label="Cidade" value={form.cidade} onChange={(v) => set("cidade", v)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 1 — Estrutura */}
        {step === 1 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Escolhe exactamente as secções que queres incluir. Nada é obrigatório — já pré-seleccionámos uma sugestão para <strong>{NIVEIS.find(n => n.id === form.nivel)?.label}</strong>.</p>
            <button onClick={() => setSecoes(defaultSecoesForNivel(form.nivel))} className="text-xs text-[#C9A84C] font-semibold underline underline-offset-2 mb-6">
              Repor predefinição deste nível
            </button>

            {(["preliminar", "corpo", "final"] as const).map(grupo => (
              <div key={grupo} className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {grupo === "preliminar" ? "Elementos Preliminares" : grupo === "corpo" ? "Corpo do Trabalho" : "Elementos Finais"}
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {secoesPorGrupo[grupo].map(s => (
                    <label key={s.id} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${secoes.has(s.id) ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-gray-100 hover:border-gray-300"}`}>
                      <input type="checkbox" checked={secoes.has(s.id)} onChange={() => toggleSecao(s.id)} className="w-4 h-4 accent-[#C9A84C]" />
                      <span className="text-sm text-[#0D0D0D]">{s.label}</span>
                      {s.geradaPorIA && <Sparkles className="w-3 h-3 text-[#C9A84C] ml-auto shrink-0" />}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* STEP 2 — Personalização (capa/logo) */}
        {step === 2 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <p className="text-sm font-bold text-[#0D0D0D] mb-1">Mostrar logótipo na capa?</p>
              <p className="text-xs text-gray-400 mb-3">Logo da escola, universidade ou empresa — centrado automaticamente.</p>
              <div className="flex gap-2">
                <button onClick={() => setMostrarLogo(true)} className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${mostrarLogo ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-gray-200 text-gray-500"}`}>Sim</button>
                <button onClick={() => setMostrarLogo(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${!mostrarLogo ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-gray-200 text-gray-500"}`}>Não</button>
              </div>
            </div>

            {mostrarLogo && (
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" /> : <ImageIcon className="w-7 h-7 text-gray-300" />}
                </div>
                <div className="flex flex-col gap-2">
                  <input ref={logoRef} type="file" accept="image/png,image/jpeg" onChange={handleLogo} className="hidden" />
                  <button onClick={() => logoRef.current?.click()} className="btn-ghost text-xs py-2 px-4">
                    <ImageIcon className="w-3.5 h-3.5" /> Carregar logótipo
                  </button>
                  {logoFile && (
                    <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Remover
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-[#F8F5EF] rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
              A formatação técnica é aplicada automaticamente: margens, Times New Roman 12pt, espaçamento 1.5, texto justificado, numeração romana nas páginas preliminares e árabe no corpo, e índice automático.
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Pré-visualização */}
        {step === 3 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#1D9E75]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0D0D0D]">Resumo do teu trabalho</h2>
                <p className="text-xs text-gray-400">Revê antes de gerar o documento</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Tema:</span> <span className="font-semibold text-[#0D0D0D]">{form.tema}</span></div>
              <div><span className="text-gray-400">Nível:</span> <span className="font-semibold text-[#0D0D0D]">{NIVEIS.find(n => n.id === form.nivel)?.label}</span></div>
              {form.area && <div><span className="text-gray-400">Área:</span> <span className="font-semibold text-[#0D0D0D]">{form.area}</span></div>}
              {form.instituicao && <div><span className="text-gray-400">Instituição:</span> <span className="font-semibold text-[#0D0D0D]">{form.instituicao}</span></div>}
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Secções incluídas ({secoes.size})</p>
              <div className="flex flex-wrap gap-1.5">
                {SECOES.filter(s => secoes.has(s.id)).map(s => (
                  <span key={s.id} className="badge bg-[#C9A84C]/10 text-[#C9A84C]">{s.label}</span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                O conteúdo gerado por IA é uma <strong>base de trabalho</strong> — revê sempre antes de submeter. A IA nunca inventa referências bibliográficas nem estatísticas; onde faltar informação, o documento indica claramente [A validar].
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 4 — Gerar */}
        {step === 4 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-5 min-h-[280px]">
            {gerando ? (
              <>
                <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
                <div>
                  <p className="font-bold text-[#0D0D0D]">A construir o teu documento...</p>
                  <p className="text-sm text-gray-400 mt-1">A gerar conteúdo e a formatar o Word. Pode demorar até 1 minuto.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-bold text-[#0D0D0D] text-lg">Pronto para gerar</p>
                  <p className="text-sm text-gray-400 mt-1">{secoes.size} secções serão incluídas no teu documento</p>
                </div>
                {erro && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 w-full text-left">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{erro}</p>
                  </div>
                )}
                <button onClick={gerarDocumento} className="btn-primary px-8 py-3.5 rounded-2xl text-sm">
                  <Sparkles className="w-4 h-4" /> Gerar Documento Word
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* STEP 5 — Download */}
        {step === 5 && docBlob && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-5">
            <div className="w-16 h-16 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#1D9E75]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0D0D0D] mb-1">Documento pronto!</h3>
              <p className="text-sm text-gray-400">Revê o conteúdo, ajusta o que precisares e adiciona as tuas referências reais.</p>
            </div>
            <button onClick={baixar} className="btn-green px-8 py-3.5 rounded-2xl text-sm">
              <Download className="w-4 h-4" /> Descarregar .docx
            </button>
          </motion.div>
        )}

        {/* Nav buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost text-sm disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                disabled={step === 0 && !podeAvancarStep0}
                className="btn-primary text-sm disabled:opacity-40"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
