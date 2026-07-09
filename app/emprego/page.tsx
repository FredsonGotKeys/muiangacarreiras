"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Briefcase, Clock, RefreshCw, X,
  ChevronRight, Mail, ExternalLink,
  Zap, CheckCircle2, Globe2, Plane,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";
import ZumboPayModal from "@/components/ZumboPayModal";
import { useSubscricao } from "@/lib/use-subscricao";
import AlertaVagasForm from "@/components/premium/AlertaVagasForm";

/* ── Tipos ── */
type Vaga = {
  slug: string; title: string; empresa: string; local: string;
  categoria: string; prazoLabel: string; diasRestantes: number | null;
  status: "Aberto" | "Encerrado"; url: string;
};
type VagaDetail = {
  slug: string; title: string; empresa: string; logoUrl: string | null;
  local: string; categoria: string; prazoLabel: string;
  diasRestantes: number | null; nivelAcademico: string | null;
  numVagas: number | null; tipoEmprego: string | null;
  sections: { heading: string; lines: string[] }[];
  appEmail: string | null; appUrl: string | null; sourceUrl: string;
  error?: string;
};

type VagaEuropa = {
  id: string; title: string; empresa: string;
  categoria: string; zona: string; data: string;
  descricao: string; url: string;
};

type TabEmprego = "nacional" | "europa";

/* ── Helpers ── */
function diasColor(d: number | null) {
  if (d === null) return "bg-gray-100 text-gray-500";
  if (d <= 3) return "bg-red-100 text-red-600";
  if (d <= 7) return "bg-orange-100 text-orange-600";
  return "bg-emerald-100 text-emerald-700";
}
function diasLabel(d: number | null) {
  if (d === null) return "Prazo indefinido";
  if (d === 0) return "Último dia!";
  if (d < 0)  return "Encerrada";
  if (d === 1) return "1 dia restante";
  return `${d} dias restantes`;
}
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "agora mesmo";
  if (diff < 60) return `há ${diff} min`;
  return `há ${Math.floor(diff / 60)}h`;
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex justify-between">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="w-20 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="h-5 bg-gray-100 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-24" />
      </div>
    </div>
  );
}

/* ── Drawer ── */
function VagaDrawer({ slug, onClose, nomeUser }: { slug: string; onClose: () => void; nomeUser: string }) {
  const [detail, setDetail] = useState<VagaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState(nomeUser);
  const [nameSubmitted, setNameSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vagas/${slug}`).then(r => r.json()).then(setDetail).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const d = detail;

  function buildMailto(email: string, title: string, empresa: string, nome: string): string {
    const subject = encodeURIComponent(`Candidatura — ${title} | ${empresa}`);
    const nomeStr = nome.trim() || "[O seu nome]";
    const body = encodeURIComponent(
`Exmo(a) Senhor(a) Responsável de Recursos Humanos,

O meu nome é ${nomeStr} e venho, por este meio, manifestar o meu interesse na vaga de ${title} disponibilizada pela ${empresa}.

Após análise cuidada dos requisitos da posição, considero reunir o perfil adequado para contribuir de forma positiva para a vossa equipa, aliando competências técnicas sólidas a uma postura proactiva e orientada para resultados.

Em anexo encontrará o meu Curriculum Vitae actualizado, com os detalhes da minha formação académica e experiência profissional.

Fico ao dispor para uma eventual entrevista, no horário e formato da vossa conveniência.

Com os melhores cumprimentos,
${nomeStr}`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:w-[min(100vw,640px)] bg-white flex flex-col overflow-hidden sm:shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Briefcase size={16} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalhe da vaga</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Fechar">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading && (
            <div className="p-5 sm:p-6 space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-4 bg-gray-100 rounded animate-pulse ${i === 0 ? "w-2/3 h-6" : i % 3 === 0 ? "w-1/2" : "w-full"}`} />
              ))}
            </div>
          )}

          {!loading && d?.error && (
            <div className="p-8 text-center">
              <p className="text-red-500 font-semibold mb-2">Não foi possível carregar esta vaga.</p>
              <p className="text-gray-400 text-sm">Tenta novamente mais tarde.</p>
            </div>
          )}

          {!loading && d && !d.error && (
            <>
              {/* Info principal */}
              <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-lg sm:text-2xl font-bold text-[#0D0D0D] leading-snug mb-1 capitalize">{d.title}</h2>
                <p className="text-[#C9A84C] font-semibold text-sm mb-3">{d.empresa}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-gray-100 text-gray-600 text-xs flex items-center gap-1"><MapPin size={10}/>{d.local}</span>
                  {d.tipoEmprego && <span className="badge bg-blue-50 text-blue-700 text-xs">{d.tipoEmprego}</span>}
                  {d.nivelAcademico && <span className="badge bg-purple-50 text-purple-700 text-xs">{d.nivelAcademico}</span>}
                  {d.numVagas && <span className="badge bg-emerald-50 text-emerald-700 text-xs">{d.numVagas} vaga{d.numVagas > 1 ? "s" : ""}</span>}
                  <span className={`badge text-xs ${diasColor(d.diasRestantes)}`}>{diasLabel(d.diasRestantes)}</span>
                </div>
              </div>

              {/* Secções */}
              <div className="px-4 sm:px-6 py-5 space-y-5">
                {d.sections.map((sec) => (
                  <div key={sec.heading}>
                    <p className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-2">{sec.heading}</p>
                    <ul className="space-y-1.5">
                      {sec.lines.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <ChevronRight size={13} className="text-[#C9A84C] mt-0.5 shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA candidatura */}
              <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-gray-100 space-y-3">
                <p className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">Candidatar-se</p>

                {d.appEmail && (
                  <>
                    {!nameSubmitted ? (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">O teu nome completo</label>
                          <input
                            value={candidateName}
                            onChange={e => setCandidateName(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full bg-white border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 placeholder:text-gray-300 transition-all"
                            onKeyDown={e => { if (e.key === "Enter" && candidateName.trim()) setNameSubmitted(true); }}
                          />
                        </div>
                        <a
                          href={buildMailto(d.appEmail, d.title, d.empresa, candidateName)}
                          onClick={() => { if (candidateName.trim()) setNameSubmitted(true); }}
                          className="flex items-center justify-center gap-2 w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-[#C9A84C]/30"
                        >
                          <Mail size={16} /> Abrir email de candidatura
                        </a>
                        <p className="text-xs text-center text-gray-400">Abre no Gmail, Outlook ou app de email instalada</p>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-2xl p-4 flex items-start gap-3">
                          <CheckCircle2 size={20} className="text-[#1D9E75] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[#1D9E75] text-sm">Email preparado!</p>
                            <p className="text-xs text-gray-500 mt-0.5">O email foi aberto com o teu nome, assunto e texto já preenchidos. Só anexa o teu CV e envia.</p>
                          </div>
                        </div>
                        <a href={buildMailto(d.appEmail, d.title, d.empresa, candidateName)}
                          className="flex items-center justify-center gap-2 w-full bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] font-bold text-sm py-3.5 rounded-xl transition-all border border-[#C9A84C]/30">
                          <Mail size={15} /> Reabrir email
                        </a>
                        <button onClick={() => { setCandidateName(""); setNameSubmitted(false); }}
                          className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
                          Usar outro nome
                        </button>
                      </div>
                    )}
                  </>
                )}

                {!d.appEmail && d.appUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">Esta vaga tem formulário próprio. Clica para te candidatares directamente no site da empresa.</p>
                    <a href={d.appUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98]">
                      <ExternalLink size={16} /> Candidatar-se agora
                    </a>
                    <p className="text-xs text-center text-gray-400">Abre o site original da empresa</p>
                  </div>
                )}

                {!d.appEmail && !d.appUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">Consulta as instruções de candidatura na fonte original.</p>
                    <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#0D0D0D] hover:bg-gray-800 text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98]">
                      <ExternalLink size={16} /> Ver vaga em njobs.co.mz
                    </a>
                  </div>
                )}
              </div>
              <div className="h-6 sm:h-0" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Drawer Europa ── */
function VagaEuropaDrawer({ vaga, onClose, nomeUser, userEmail }: {
  vaga: VagaEuropa; onClose: () => void; nomeUser: string; userEmail: string;
}) {
  const [candidateName, setCandidateName] = useState(nomeUser);
  const [candidateEmail, setCandidateEmail] = useState(userEmail);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  async function handleSubmit() {
    if (!candidateName.trim()) { setError("Preenche o teu nome."); return; }
    if (!candidateEmail.trim()) { setError("Preenche o teu email."); return; }
    if (!cvFile) { setError("Anexa o teu CV em PDF."); return; }
    setSubmitting(true); setError(null);

    const formData = new FormData();
    formData.append("nome", candidateName.trim());
    formData.append("email", candidateEmail.trim());
    formData.append("vagaTitulo", vaga.title);
    formData.append("vagaEmpresa", vaga.empresa);
    formData.append("vagaZona", vaga.zona);
    formData.append("vagaUrl", vaga.url);
    formData.append("cv", cvFile);

    try {
      const res = await fetch("/api/candidatura-europa", { method: "POST", body: formData });
      if (res.ok) { setSubmitted(true); }
      else { const d = await res.json(); setError(d.error ?? "Erro ao enviar candidatura."); }
    } catch { setError("Erro de ligação."); }
    setSubmitting(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:w-[min(100vw,640px)] bg-white flex flex-col overflow-hidden sm:shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Globe2 size={16} className="text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vaga Europa</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Fechar">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Info principal */}
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-[#0D0D0D] leading-snug mb-1">{vaga.title}</h2>
            <p className="text-blue-600 font-semibold text-sm mb-3">{vaga.empresa}</p>
            <div className="flex flex-wrap gap-2">
              {vaga.zona && <span className="badge bg-gray-100 text-gray-600 text-xs flex items-center gap-1"><MapPin size={10}/>{vaga.zona}</span>}
              {vaga.categoria && <span className="badge bg-blue-50 text-blue-700 text-xs">{vaga.categoria}</span>}
              {vaga.data && <span className="badge bg-gray-100 text-gray-500 text-xs flex items-center gap-1"><Clock size={10}/>{vaga.data}</span>}
              <span className="badge bg-blue-100 text-blue-700 text-xs">🇪🇺 Europa</span>
            </div>
          </div>

          {/* Descrição */}
          {vaga.descricao && (
            <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
              <p className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-2">Descrição</p>
              <p className="text-sm text-gray-500 leading-relaxed">{vaga.descricao}</p>
            </div>
          )}

          {/* Candidatura */}
          <div className="px-4 sm:px-6 pb-6 pt-5 space-y-4">
            <p className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">Candidatar-se via MUIANGA</p>

            {submitted ? (
              <div className="space-y-4">
                <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-2xl p-5 flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-[#1D9E75] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#1D9E75] text-base">Candidatura enviada!</p>
                    <p className="text-sm text-gray-500 mt-1">A tua candidatura para <span className="font-semibold text-[#0D0D0D]">{vaga.title}</span> na <span className="font-semibold">{vaga.empresa}</span> foi recebida.</p>
                    <p className="text-xs text-gray-400 mt-2">A MUIANGA Carreiras vai reencaminhar o teu CV directamente para a empresa. Receberás feedback por email.</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-full bg-[#0D0D0D] hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-sm transition-all">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                  <Globe2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    A MUIANGA envia o teu CV directamente para a empresa europeia. Processo seguro e acompanhado.
                  </p>
                </div>

                <div>
                  <label className="label-xs mb-1.5">Nome completo</label>
                  <input value={candidateName} onChange={e => setCandidateName(e.target.value)}
                    placeholder="O teu nome completo"
                    className="input-field" />
                </div>

                <div>
                  <label className="label-xs mb-1.5">Email de contacto</label>
                  <input type="email" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="input-field" />
                </div>

                <div>
                  <label className="label-xs mb-1.5">Curriculum Vitae (PDF) <span className="text-red-400">*</span></label>
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 rounded-xl py-5 cursor-pointer transition-all">
                    <input type="file" accept=".pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) setCvFile(e.target.files[0]); }} />
                    {cvFile ? (
                      <span className="text-sm font-semibold text-[#1D9E75] flex items-center gap-2">
                        <CheckCircle2 size={16} /> {cvFile.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Clica para anexar o teu CV em PDF</span>
                    )}
                  </label>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3">
                    <span className="text-xs text-red-600">{error}</span>
                  </div>
                )}

                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {submitting ? "A enviar..." : <><Mail size={16} /> Enviar candidatura</>}
                </button>

                <p className="text-xs text-center text-gray-400">
                  O teu CV será encaminhado pela MUIANGA Carreiras
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════ */
export default function EmpregoPage() {
  const [vagas, setVagas]               = useState<Vaga[]>([]);
  const [vagasLoading, setVagasLoading] = useState(true);
  const [vagasError, setVagasError]     = useState<string | null>(null);
  const [updatedAt, setUpdatedAt]       = useState<string | null>(null);
  const [vagasFetched, setVagasFetched] = useState(false);

  const { user } = useAuth();
  const { estado: estadoSub, diasRestantes: diasSub } = useSubscricao();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal]   = useState(false);
  const [subModalFase, setSubModalFase]   = useState<"metodo" | "aguardando">("metodo");
  const [pendingSlug, setPendingSlug]     = useState<string | null>(null);
  const nomeUser: string = (user?.user_metadata?.nome as string | undefined) || user?.email?.split("@")[0] || "";
  const [drawerSlug, setDrawerSlug] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setDrawerSlug(null), []);
  const [selectedEuropaVaga, setSelectedEuropaVaga] = useState<VagaEuropa | null>(null);
  const [tab, setTab] = useState<TabEmprego>("nacional");
  const [vagasEuropa, setVagasEuropa] = useState<VagaEuropa[]>([]);
  const [europaLoading, setEuropaLoading] = useState(false);
  const [europaFetched, setEuropaFetched] = useState(false);
  const [europaUpdatedAt, setEuropaUpdatedAt] = useState<string | null>(null);

  /* Detecta retorno do checkout de cartão via ?pagamento=sucesso (processador nunca exposto ao utilizador) */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pagamento") === "sucesso" && user) {
      setSubModalFase("aguardando");
      setShowSubModal(true);
      // Limpa o URL sem recarregar a página
      const url = new URL(window.location.href);
      url.searchParams.delete("pagamento");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user]);

  /* Carregar vagas nacionais ao montar */
  useEffect(() => {
    if (vagasFetched) return;
    setVagasLoading(true);
    setVagasError(null);
    fetch("/api/vagas")
      .then(r => r.json())
      .then(data => { setVagas(data.vagas ?? []); setUpdatedAt(data.updatedAt ?? null); setVagasFetched(true); })
      .catch(() => setVagasError("Não foi possível carregar as vagas. Tenta novamente."))
      .finally(() => setVagasLoading(false));
  }, [vagasFetched]);

  /* Carregar vagas Europa ao seleccionar tab */
  useEffect(() => {
    if (tab !== "europa" || europaFetched) return;
    setEuropaLoading(true);
    fetch("/api/vagas-europa")
      .then(r => r.json())
      .then(data => { setVagasEuropa(data.vagas ?? []); setEuropaUpdatedAt(data.updatedAt ?? null); setEuropaFetched(true); })
      .catch(() => {})
      .finally(() => setEuropaLoading(false));
  }, [tab, europaFetched]);

  function refreshVagas() {
    if (tab === "nacional") { setVagasFetched(false); setVagas([]); }
    else { setEuropaFetched(false); setVagasEuropa([]); }
  }

  function openVaga(slug: string) {
    if (!user) { setPendingSlug(slug); setShowAuthModal(true); }
    else if (estadoSub === "loading") { setPendingSlug(slug); }
    else if (estadoSub !== "ativa") { setPendingSlug(slug); setShowSubModal(true); }
    else { setDrawerSlug(slug); }
  }

  useEffect(() => {
    if (!pendingSlug || estadoSub === "loading" || showAuthModal || showSubModal) return;
    if (estadoSub === "ativa") { setDrawerSlug(pendingSlug); setPendingSlug(null); }
    else { setShowSubModal(true); }
  }, [estadoSub, pendingSlug, showAuthModal, showSubModal]);

  return (
    <div className="bg-white min-h-screen">

      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingSlug(null); }}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
      {showSubModal && user && (
        <ZumboPayModal
          initialFase={subModalFase}
          onClose={() => { setShowSubModal(false); setPendingSlug(null); setSubModalFase("metodo"); }}
          onSuccess={() => { setShowSubModal(false); setPendingSlug(null); setSubModalFase("metodo"); }}
        />
      )}
      {drawerSlug && <VagaDrawer slug={drawerSlug} onClose={closeDrawer} nomeUser={nomeUser} />}
      {selectedEuropaVaga && (
        <VagaEuropaDrawer
          vaga={selectedEuropaVaga}
          onClose={() => setSelectedEuropaVaga(null)}
          nomeUser={nomeUser}
          userEmail={user?.email ?? ""}
        />
      )}

      {/* ── HERO ── */}
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 mb-3">
            Vagas de Emprego
          </span>
          <h1 className="text-2xl sm:text-5xl font-bold text-[#0D0D0D] mb-2 sm:mb-3 leading-tight">
            Talento encontra <span className="text-[#C9A84C]">oportunidade</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Vagas reais actualizadas em tempo real — candidata-te directamente por email, sem sair do site.
          </p>
          {/* Stats inline */}
          <div className="flex items-center gap-5 mt-5 flex-wrap">
            {!vagasLoading && vagasFetched && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
                <span className="font-bold text-[#0D0D0D]">{vagas.length}</span>
                <span className="text-gray-400">vagas em aberto</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <span className="font-semibold text-[#0D0D0D]">199 MT/mês</span>
              <span>· acesso ilimitado</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Banners de estado */}
        {user && estadoSub === "pendente" && (
          <div className="flex items-start gap-3 mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700">Pagamento em verificação</p>
              <p className="text-xs text-amber-600">Activamos o teu acesso em até 24h após confirmar o pagamento.</p>
            </div>
          </div>
        )}
        {user && (estadoSub === "expirada" || estadoSub === "sem_sub") && (
          <div className="relative mb-8 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1A1208 100%)" }}>
            {/* glow dourado */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }} />
            <div className="relative px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-12 h-12 bg-[#C9A84C]/20 rounded-2xl flex items-center justify-center shrink-0 border border-[#C9A84C]/30">
                <Zap size={22} className="text-[#C9A84C] fill-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg sm:text-xl leading-tight mb-1">
                  {estadoSub === "expirada" ? "A tua subscrição expirou" : "Desbloqueia o acesso às vagas"}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Candidata-te a todas as vagas com email pré-preenchido. Apenas{" "}
                  <span className="text-[#C9A84C] font-bold">199 MT/mês</span> — cancela quando quiseres.
                </p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {["Candidatura por email em 1 clique", "Acesso a todas as vagas", "Cancela quando quiseres"].map((item) => (
                    <span key={item} className="flex items-center gap-1.5 text-xs text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />{item}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowSubModal(true)}
                className="shrink-0 bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold px-7 py-4 rounded-xl transition-all active:scale-95 text-sm whitespace-nowrap shadow-lg shadow-[#C9A84C]/30"
              >
                Activar por 199 MT →
              </button>
            </div>
          </div>
        )}
        {user && estadoSub === "ativa" && diasSub !== null && diasSub <= 7 && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
            <Clock size={15} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-700 flex-1">
              O teu acesso expira em <span className="font-bold">{diasSub} dia{diasSub !== 1 ? "s" : ""}</span>. Renova para não perderes as candidaturas.
            </p>
            <button onClick={() => setShowSubModal(true)} className="text-xs font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg transition-all shrink-0">
              Renovar
            </button>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
          <button onClick={() => setTab("nacional")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "nacional" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="text-base">🇲🇿</span> Moçambique
            {vagasFetched && <span className="text-xs opacity-60">({vagas.length})</span>}
          </button>
          <button onClick={() => setTab("europa")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "europa" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="text-base">🇪🇺</span> Europa
            {europaFetched && <span className="text-xs opacity-60">({vagasEuropa.length})</span>}
          </button>
        </div>

        {/* ════════════ TAB NACIONAL ════════════ */}
        {tab === "nacional" && (
          <>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-[#0D0D0D]">Vagas em aberto</h2>
                {!vagasLoading && vagasFetched && (
                  <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">{vagas.length} vagas</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {updatedAt && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {timeAgo(updatedAt)}</span>}
                {vagasFetched && (
                  <button onClick={refreshVagas} className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 px-3 py-1.5 rounded-full transition-all border border-[#C9A84C]/20">
                    <RefreshCw size={10}/> Actualizar
                  </button>
                )}
              </div>
            </div>

            {vagasFetched && vagas.length > 0 && (
              <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-[#F8F5EF] border border-amber-100 rounded-xl w-fit">
                <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse shrink-0" />
                <span className="text-xs text-gray-500">Fonte: <span className="font-semibold text-[#0D0D0D]">njobs.co.mz</span> · actualizado a cada hora</span>
              </div>
            )}

            <div className="mb-6">
              <AlertaVagasForm />
            </div>

            {vagasLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {vagasError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-semibold mb-2">{vagasError}</p>
                <button onClick={refreshVagas} className="btn-primary mt-2">Tentar novamente</button>
              </div>
            )}
            {!vagasLoading && !vagasError && vagas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {vagas.map((v) => (
                  <button key={v.slug} onClick={() => openVaga(v.slug)} className="service-card group text-left active:scale-[0.98]">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Briefcase size={18} className="text-amber-600" />
                      </div>
                      <span className={`badge ${diasColor(v.diasRestantes)}`}>{diasLabel(v.diasRestantes)}</span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-[#0D0D0D] leading-snug group-hover:text-[#C9A84C] transition-colors capitalize">{v.title}</h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-gray-500 text-xs font-semibold">{v.empresa}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={10}/>{v.local}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">{v.categoria}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock size={10}/> <span className="font-medium text-[#0D0D0D]">{v.prazoLabel}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 group-hover:bg-[#1D9E75] group-hover:text-white px-3 py-1.5 rounded-full transition-all">
                        Ver detalhes →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!vagasLoading && !vagasError && vagasFetched && vagas.length === 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
                <p className="text-gray-500 font-semibold mb-1">Sem vagas disponíveis neste momento</p>
                <p className="text-gray-400 text-sm">Verifica mais tarde.</p>
                <button onClick={refreshVagas} className="btn-primary mt-4">Actualizar</button>
              </div>
            )}
          </>
        )}

        {/* ════════════ TAB EUROPA ════════════ */}
        {tab === "europa" && (
          <>
            {/* Banner emocional */}
            <div className="relative mb-8 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0B1628 0%, #122044 50%, #0D0D0D 100%)" }}>
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }} />
              <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }} />
              <div className="relative px-6 py-7 sm:px-8 sm:py-8">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-blue-400/30">
                    <Plane size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl sm:text-2xl leading-tight mb-2">
                      Trabalha na <span className="text-blue-400">Europa</span>
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                      Centenas de empresas europeias a recrutar agora. Vagas reais com contrato, em Portugal, Espanha, Alemanha e mais — o teu futuro pode começar hoje.
                    </p>
                    <div className="flex items-center gap-4 mt-4 flex-wrap">
                      {["Vagas com contrato", "Empresas verificadas", "Actualizado a cada hora"].map((item) => (
                        <span key={item} className="flex items-center gap-1.5 text-xs text-white/60">
                          <CheckCircle2 size={11} className="text-blue-400" />{item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-[#0D0D0D]">Vagas na Europa</h2>
                {europaFetched && (
                  <span className="badge bg-blue-100 text-blue-700 border border-blue-200">{vagasEuropa.length} vagas</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {europaUpdatedAt && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {timeAgo(europaUpdatedAt)}</span>}
                {europaFetched && (
                  <button onClick={refreshVagas} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all border border-blue-200">
                    <RefreshCw size={10}/> Actualizar
                  </button>
                )}
              </div>
            </div>

            {europaFetched && vagasEuropa.length > 0 && (
              <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl w-fit">
                <Globe2 size={12} className="text-blue-500 shrink-0" />
                <span className="text-xs text-gray-500">Fonte: <span className="font-semibold text-[#0D0D0D]">net-empregos.com</span> · vagas em tempo real</span>
              </div>
            )}

            {/* Loading */}
            {europaLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Grid Europa */}
            {!europaLoading && vagasEuropa.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {vagasEuropa.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { if (!user) { setShowAuthModal(true); } else if (estadoSub !== "ativa") { setShowSubModal(true); } else { setSelectedEuropaVaga(v); } }}
                    className="service-card group text-left active:scale-[0.98] hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Globe2 size={18} className="text-blue-600" />
                      </div>
                      <span className="badge bg-blue-100 text-blue-700 text-[10px]">🇪🇺 Europa</span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-[#0D0D0D] leading-snug group-hover:text-blue-600 transition-colors">
                      {v.title}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-gray-500 text-xs font-semibold">{v.empresa}</p>
                      {v.zona && <div className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={10}/>{v.zona}</div>}
                    </div>
                    {v.categoria && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge bg-gray-100 text-gray-600 text-xs">{v.categoria}</span>
                      </div>
                    )}
                    {v.descricao && (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{v.descricao}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      {v.data && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock size={10}/> <span className="font-medium text-[#0D0D0D]">{v.data}</span>
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-full transition-all">
                        Candidatar →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!europaLoading && europaFetched && vagasEuropa.length === 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
                <p className="text-gray-500 font-semibold mb-1">Sem vagas disponíveis neste momento</p>
                <p className="text-gray-400 text-sm">As vagas europeias são actualizadas a cada hora. Volta em breve.</p>
                <button onClick={refreshVagas} className="btn-primary mt-4">Actualizar</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
