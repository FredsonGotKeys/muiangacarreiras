"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Headphones, PenTool, Globe2, Share2, Table2,
  MapPin, Briefcase, Clock, RefreshCw, X,
  GraduationCap, Users, ChevronRight, Mail, ExternalLink,
  Zap, CheckCircle2, LogIn,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";
import SubscricaoModal from "@/components/SubscricaoModal";
import { useSubscricao } from "@/lib/use-subscricao";

/* ── Boladas (estáticas) ── */
type Bolada = {
  id: string; Icon: LucideIcon; iconBg: string; iconColor: string;
  title: string; prazo: string; valor: string; descricao: string;
  email: string;
};
const boladas: Bolada[] = [
  { id:"b1", Icon:Headphones, iconBg:"bg-sky-50",    iconColor:"text-sky-600",    title:"Transcrição de áudio para texto (PT)",           prazo:"3 dias", valor:"800 MT",   descricao:"Transcrever 2 horas de áudio em português para documento Word formatado.",        email:"minville@outlook.pt" },
  { id:"b2", Icon:Globe2,     iconBg:"bg-emerald-50",iconColor:"text-emerald-600",title:"Tradução EN→PT de documento técnico",             prazo:"5 dias", valor:"1.500 MT", descricao:"Tradução de relatório técnico (8 páginas) de inglês para português.",             email:"minville@outlook.pt" },
  { id:"b3", Icon:PenTool,    iconBg:"bg-rose-50",   iconColor:"text-rose-500",   title:"Design de cartaz para evento",                    prazo:"2 dias", valor:"1.200 MT", descricao:"Criar cartaz A3 para evento empresarial em Maputo. Briefing fornecido.",           email:"minville@outlook.pt" },
  { id:"b4", Icon:Share2,     iconBg:"bg-violet-50", iconColor:"text-violet-600", title:"Publicação de conteúdo em redes sociais (1 sem.)", prazo:"7 dias", valor:"2.000 MT", descricao:"Gerir e publicar conteúdo pré-aprovado em Instagram e Facebook.",                  email:"minville@outlook.pt" },
  { id:"b5", Icon:Table2,     iconBg:"bg-teal-50",   iconColor:"text-teal-600",   title:"Entrada de dados em Excel",                       prazo:"2 dias", valor:"600 MT",   descricao:"Inserir lista de 500 contactos numa folha Excel com formatação definida.",         email:"minville@outlook.pt" },
];

/* ── Vaga (listagem) ── */
type Vaga = {
  slug: string; title: string; empresa: string; local: string;
  categoria: string; prazoLabel: string; diasRestantes: number | null;
  status: "Aberto" | "Encerrado"; url: string;
};

/* ── Vaga detalhe (drawer) ── */
type VagaDetail = {
  slug: string; title: string; empresa: string; logoUrl: string | null;
  local: string; categoria: string; prazoLabel: string;
  diasRestantes: number | null; nivelAcademico: string | null;
  numVagas: number | null; tipoEmprego: string | null;
  sections: { heading: string; lines: string[] }[];
  appEmail: string | null;
  appUrl: string | null;
  sourceUrl: string;
  error?: string;
};

/* ── helpers ── */
function diasColor(d: number | null) {
  if (d === null) return "bg-gray-100 text-gray-500";
  if (d <= 3)  return "bg-red-100 text-red-600";
  if (d <= 7)  return "bg-orange-100 text-orange-600";
  return "bg-emerald-100 text-emerald-700";
}
function diasLabel(d: number | null) {
  if (d === null) return "Prazo indefinido";
  if (d === 0)   return "Último dia!";
  if (d < 0)     return "Encerrada";
  if (d === 1)   return "1 dia restante";
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
        <div className="w-10 h-10 bg-gray-100 rounded-xl"/>
        <div className="w-20 h-5 bg-gray-100 rounded-full"/>
      </div>
      <div className="h-4 bg-gray-100 rounded w-3/4"/>
      <div className="h-3 bg-gray-100 rounded w-1/2"/>
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="h-5 bg-gray-100 rounded-full w-20"/>
        <div className="h-5 bg-gray-100 rounded-full w-24"/>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   DRAWER — detalhe da vaga (mobile-first)
════════════════════════════════════════════ */
function VagaDrawer({ slug, onClose, nomeUser }: { slug: string; onClose: () => void; nomeUser: string }) {
  const [detail, setDetail] = useState<VagaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState(nomeUser);
  const [nameSubmitted, setNameSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vagas/${slug}`)
      .then(r => r.json())
      .then(setDetail)
      .finally(() => setLoading(false));
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer — full screen mobile, slide-over desktop */}
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:w-[min(100vw,640px)] bg-white flex flex-col overflow-hidden sm:shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Briefcase size={16} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalhe da vaga</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Loading */}
          {loading && (
            <div className="p-5 sm:p-6 space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-4 bg-gray-100 rounded animate-pulse ${i === 0 ? "w-2/3 h-6" : i % 3 === 0 ? "w-1/2" : "w-full"}`} />
              ))}
            </div>
          )}

          {/* Erro */}
          {!loading && d?.error && (
            <div className="p-8 text-center">
              <p className="text-red-500 font-semibold mb-2">Não foi possível carregar esta vaga.</p>
              <p className="text-gray-400 text-sm">Tenta novamente mais tarde.</p>
            </div>
          )}

          {!loading && d && !d.error && (
            <>
              {/* Hero */}
              <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0D0D0D] mb-1 leading-snug capitalize">{d.title}</h2>
                <p className="text-[#C9A84C] font-semibold text-sm sm:text-base mb-4">{d.empresa}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {d.diasRestantes !== null && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${diasColor(d.diasRestantes)}`}>
                      <Clock size={10} /> {diasLabel(d.diasRestantes)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    <MapPin size={10} /> {d.local}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {d.categoria}
                  </span>
                </div>

                {/* Meta info — scroll horizontal no mobile */}
                <div className="grid grid-cols-2 gap-2.5">
                  {d.prazoLabel && (
                    <div className="bg-[#F8F5EF] rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Prazo</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#0D0D0D] leading-tight">{d.prazoLabel}</p>
                    </div>
                  )}
                  {d.nivelAcademico && (
                    <div className="bg-[#F8F5EF] rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Nível académico</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#0D0D0D] leading-tight flex items-center gap-1">
                        <GraduationCap size={12} className="text-[#C9A84C] shrink-0" /> {d.nivelAcademico}
                      </p>
                    </div>
                  )}
                  {d.numVagas && (
                    <div className="bg-[#F8F5EF] rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Nº de vagas</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#0D0D0D] flex items-center gap-1">
                        <Users size={12} className="text-[#C9A84C]" /> {d.numVagas} vaga{d.numVagas > 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                  {d.tipoEmprego && (
                    <div className="bg-[#F8F5EF] rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Tipo</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#0D0D0D]">{d.tipoEmprego}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Secções da descrição */}
              {d.sections.length > 0 && (
                <div className="px-4 sm:px-6 py-5 border-b border-gray-100 space-y-5">
                  {d.sections.map(({ heading, lines }) => (
                    <div key={heading}>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0D0D0D] mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#C9A84C] rounded-full inline-block shrink-0" />
                        {heading}
                      </h3>
                      <ul className="space-y-1.5 pl-3">
                        {lines.map((line, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A84C]/60 shrink-0" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {d.sections.length === 0 && (
                <div className="px-4 sm:px-6 py-8 border-b border-gray-100 text-center">
                  <p className="text-gray-400 text-sm">Descrição não disponível.</p>
                </div>
              )}

              {/* ── CANDIDATURA ── */}
              <div className="px-4 sm:px-6 py-5 bg-[#F8F5EF]">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25 mb-3">
                  Como candidatar-se
                </span>

                {/* Email: pede o nome antes de abrir o mailto */}
                {d.appEmail && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Email de candidatura</p>
                      <p className="text-sm font-bold text-[#0D0D0D] break-all">{d.appEmail}</p>
                    </div>

                    {!nameSubmitted ? (
                      <>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Introduz o teu nome para personalizarmos o email automaticamente. Só precisas de <span className="font-semibold text-[#0D0D0D]">anexar o CV</span>.
                        </p>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">O teu nome completo</label>
                          <input
                            type="text"
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
                          <Mail size={16} />
                          Abrir email de candidatura
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
                        <a
                          href={buildMailto(d.appEmail, d.title, d.empresa, candidateName)}
                          className="flex items-center justify-center gap-2 w-full bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] font-bold text-sm py-3.5 rounded-xl transition-all border border-[#C9A84C]/30"
                        >
                          <Mail size={15} />
                          Reabrir email
                        </a>
                        <button
                          onClick={() => { setCandidateName(""); setNameSubmitted(false); }}
                          className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
                        >
                          Usar outro nome
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Link externo (ex: Contact, formulário próprio) */}
                {!d.appEmail && d.appUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Esta vaga tem formulário de candidatura próprio. Clica para te candidatares directamente no site da empresa.
                    </p>
                    <a
                      href={d.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98]"
                    >
                      <ExternalLink size={16} />
                      Candidatar-se agora
                    </a>
                    <p className="text-xs text-center text-gray-400">Abre o site original da empresa</p>
                  </div>
                )}

                {/* Fallback */}
                {!d.appEmail && !d.appUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Consulta as instruções de candidatura completas na fonte original.
                    </p>
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#0D0D0D] hover:bg-gray-800 text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98]"
                    >
                      <ExternalLink size={16} />
                      Ver vaga em njobs.co.mz
                    </a>
                  </div>
                )}
              </div>

              {/* Safe area bottom no mobile */}
              <div className="h-6 sm:h-0" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════ */
export default function EmpregoPage() {
  const [tab, setTab] = useState<"bolada" | "vaga">("bolada");

  /* Boladas */
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [candidateForm, setCandidateForm] = useState({ nome: "", contacto: "", mensagem: "" });
  const [submitted, setSubmitted] = useState(false);

  /* Vagas */
  const [vagas, setVagas]               = useState<Vaga[]>([]);
  const [vagasLoading, setVagasLoading] = useState(false);
  const [vagasError, setVagasError]     = useState<string | null>(null);
  const [updatedAt, setUpdatedAt]       = useState<string | null>(null);
  const [vagasFetched, setVagasFetched] = useState(false);

  /* Auth + Subscrição */
  const { user, loading: authLoading } = useAuth();
  const { estado: estadoSub, diasRestantes: diasSub } = useSubscricao();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const nomeUser: string = (user?.user_metadata?.nome as string | undefined) || user?.email?.split("@")[0] || "";

  /* Drawer */
  const [drawerSlug, setDrawerSlug] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setDrawerSlug(null), []);

  function openVaga(slug: string) {
    if (!user) {
      setPendingSlug(slug);
      setShowAuthModal(true);
    } else if (estadoSub === "loading") {
      // Auth carregada mas sub ainda a verificar — guarda e aguarda
      setPendingSlug(slug);
    } else if (estadoSub !== "ativa") {
      setPendingSlug(slug);
      setShowSubModal(true);
    } else {
      setDrawerSlug(slug);
    }
  }

  // Quando estadoSub resolver após login, abre automaticamente o drawer pendente
  useEffect(() => {
    if (!pendingSlug || estadoSub === "loading" || showAuthModal || showSubModal) return;
    if (estadoSub === "ativa") {
      setDrawerSlug(pendingSlug);
      setPendingSlug(null);
    } else if (estadoSub !== "loading") {
      setShowSubModal(true);
    }
  }, [estadoSub, pendingSlug, showAuthModal, showSubModal]);

  function onAuthSuccess(nome: string) {
    setShowAuthModal(false);
    void nome;
    // pendingSlug + useEffect acima tratam do resto quando estadoSub resolver
  }

  function onSubEnviada() {
    setShowSubModal(false);
    setPendingSlug(null);
  }

  useEffect(() => {
    if (tab !== "vaga" || vagasFetched) return;
    setVagasLoading(true);
    setVagasError(null);
    fetch("/api/vagas")
      .then(r => r.json())
      .then(data => { setVagas(data.vagas ?? []); setUpdatedAt(data.updatedAt ?? null); setVagasFetched(true); })
      .catch(() => setVagasError("Não foi possível carregar as vagas. Tenta novamente."))
      .finally(() => setVagasLoading(false));
  }, [tab, vagasFetched]);

  function refreshVagas() { setVagasFetched(false); setVagas([]); }

  async function handleCandidate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/candidatura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...candidateForm, job_id: candidateId }),
    });
    setSubmitted(true);
  }

  return (
    <div className="bg-white min-h-screen">

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingSlug(null); }}
          onSuccess={onAuthSuccess}
        />
      )}

      {/* Subscrição Modal */}
      {showSubModal && (
        <SubscricaoModal
          onClose={() => { setShowSubModal(false); setPendingSlug(null); }}
          onSucesso={onSubEnviada}
        />
      )}

      {/* Drawer */}
      {drawerSlug && <VagaDrawer slug={drawerSlug} onClose={closeDrawer} nomeUser={nomeUser} />}

      {/* HERO */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 mb-3">
            Emprego & Oportunidades
          </span>
          <h1 className="text-2xl sm:text-5xl font-bold text-[#0D0D0D] mb-2 sm:mb-3 leading-tight">
            Talento encontra <span className="text-[#C9A84C]">oportunidade</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Boladas pagas e vagas reais actualizadas em tempo real — tudo sem sair do site.
          </p>
        </div>
      </section>

      {/* TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {(["bolada", "vaga"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-2xl p-4 sm:p-6 text-left transition-all duration-200 border-2 ${
                tab === t
                  ? t === "bolada" ? "bg-[#C9A84C] border-[#C9A84C] shadow-lg shadow-[#C9A84C]/25" : "bg-[#0D0D0D] border-[#0D0D0D] shadow-lg"
                  : "bg-white border-gray-200 hover:border-gray-300 active:scale-[0.98]"
              }`}>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 ${tab === t ? "bg-white/20" : t === "bolada" ? "bg-[#C9A84C]/10" : "bg-gray-100"}`}>
                {t === "bolada"
                  ? <Zap size={16} className={tab === t ? "text-white fill-white" : "text-[#C9A84C] fill-[#C9A84C]"} />
                  : <Briefcase size={16} className={tab === t ? "text-white" : "text-gray-500"} />}
              </div>
              <p className={`font-bold text-sm sm:text-xl mb-0.5 sm:mb-1 leading-tight ${tab === t ? "text-white" : "text-[#0D0D0D]"}`}>
                {t === "bolada" ? "Boladas" : "Vagas"}
              </p>
              <p className={`text-xs hidden sm:block ${tab === t ? "text-white/70" : "text-gray-500"}`}>
                {t === "bolada" ? "Micro-trabalhos pagos — executa e recebe directamente." : "Vagas reais de njobs.co.mz — candidata-te aqui mesmo."}
              </p>
              <span className={`inline-flex mt-2 sm:mt-3 text-xs font-bold px-2.5 py-1 rounded-full ${tab === t ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                {t === "bolada" ? `${boladas.length} disponíveis` : vagasLoading ? "A carregar..." : vagasFetched ? `${vagas.length} em aberto` : "Ver vagas →"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── BOLADAS ── */}
        {tab === "bolada" && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-[#0D0D0D]">Boladas disponíveis</h2>
              <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">{boladas.length} listadas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {boladas.map((b) => (
                <div key={b.id} className="service-card">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 ${b.iconBg} rounded-xl flex items-center justify-center`}>
                      <b.Icon size={18} className={b.iconColor} />
                    </div>
                    <span className="badge bg-[#1D9E75]/10 text-[#1D9E75]">Aberto</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0D0D0D] leading-snug">{b.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed flex-1">{b.descricao}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-sky-100 text-sky-700">Remoto</span>
                    <span className="badge bg-gray-100 text-gray-500">{b.prazo}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <span className="text-[#C9A84C] font-bold text-sm">{b.valor}</span>
                    <button
                      onClick={() => { setCandidateId(b.id); setTimeout(() => document.getElementById("form-candidatura")?.scrollIntoView({ behavior: "smooth" }), 100); }}
                      className="text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-white px-3 py-1.5 rounded-full transition-all active:scale-95"
                    >
                      Candidatar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── VAGAS ── */}
        {tab === "vaga" && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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

            {/* Banner estado subscrição */}
            {user && estadoSub === "pendente" && (
              <div className="flex items-start gap-3 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700">Pagamento em verificação</p>
                  <p className="text-xs text-amber-600">Activamos o teu acesso em até 24h após confirmar o pagamento.</p>
                </div>
              </div>
            )}
            {user && (estadoSub === "expirada" || estadoSub === "sem_sub") && (
              <div className="flex items-start gap-3 mb-4 px-4 py-3 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-xl">
                <Zap size={15} className="text-[#C9A84C] fill-[#C9A84C] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0D0D0D]">{estadoSub === "expirada" ? "Subscrição expirada" : "Acesso Premium necessário"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Activa por <span className="font-semibold text-[#C9A84C]">199 MT/mês</span> para te candidatares a qualquer vaga.</p>
                </div>
                <button onClick={() => setShowSubModal(true)} className="text-xs font-bold text-white bg-[#C9A84C] hover:bg-[#B8943E] px-3 py-1.5 rounded-lg transition-all shrink-0">
                  Activar
                </button>
              </div>
            )}
            {user && estadoSub === "ativa" && diasSub !== null && diasSub <= 7 && (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                <Clock size={15} className="text-orange-500 shrink-0" />
                <p className="text-xs text-orange-700 flex-1">
                  O teu acesso expira em <span className="font-bold">{diasSub} dia{diasSub !== 1 ? "s" : ""}</span>. Renova para não perderes as candidaturas.
                </p>
                <button onClick={() => setShowSubModal(true)} className="text-xs font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg transition-all shrink-0">
                  Renovar
                </button>
              </div>
            )}

            {vagasFetched && vagas.length > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#F8F5EF] border border-amber-100 rounded-xl w-fit">
                <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse shrink-0"/>
                <span className="text-xs text-gray-500">Fonte: <span className="font-semibold text-[#0D0D0D]">njobs.co.mz</span> · actualizado a cada hora</span>
              </div>
            )}

            {vagasLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i}/>)}
              </div>
            )}

            {vagasError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-semibold mb-2">{vagasError}</p>
                <button onClick={refreshVagas} className="btn-primary mt-2">Tentar novamente</button>
              </div>
            )}

            {!vagasLoading && !vagasError && vagas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {vagas.map((v) => (
                  <button
                    key={v.slug}
                    onClick={() => openVaga(v.slug)}
                    className="service-card group text-left active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Briefcase size={18} className="text-amber-600"/>
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
      </section>

      {/* FORMULÁRIO BOLADA */}
      {candidateId && tab === "bolada" && (
        <section id="form-candidatura" className="bg-[#F8F5EF] border-t border-gray-100 py-12 sm:py-16">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 mb-3 inline-flex">Candidatura</span>
            <h2 className="text-xl sm:text-3xl font-bold text-[#0D0D0D] mb-6">{boladas.find(b => b.id === candidateId)?.title}</h2>
            {submitted ? (
              <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-2xl p-8 text-center">
                <CheckCircle2 size={32} className="text-[#1D9E75] mx-auto mb-3" />
                <p className="text-xl font-bold text-[#1D9E75] mb-2">Candidatura enviada!</p>
                <p className="text-gray-500 text-sm">Entraremos em contacto brevemente.</p>
                <button onClick={() => { setSubmitted(false); setCandidateId(null); }} className="btn-primary mt-6">Ver mais oportunidades</button>
              </div>
            ) : (
              <form onSubmit={handleCandidate} className="space-y-4 bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                {[{ name:"nome", label:"Nome completo", placeholder:"O seu nome" }, { name:"contacto", label:"Contacto (tel / email)", placeholder:"+258 84 000 0000" }].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <input type="text" required placeholder={placeholder} value={candidateForm[name as keyof typeof candidateForm]}
                      onChange={e => setCandidateForm(f => ({ ...f, [name]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300"/>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mensagem / experiência relevante</label>
                  <textarea rows={4} required placeholder="Apresente-se brevemente..."
                    value={candidateForm.mensagem}
                    onChange={e => setCandidateForm(f => ({ ...f, mensagem: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300 resize-none"/>
                </div>
                <button type="submit" className="btn-primary w-full justify-center py-4 text-base rounded-xl">Enviar Candidatura →</button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
