"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Briefcase, Clock, RefreshCw, X,
  ChevronRight, Mail, ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";
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
    const subject = encodeURIComponent(`Candidatura: ${title} | ${empresa}`);
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
                <h2 className="text-lg sm:text-2xl font-bold text-[#2A0001] leading-snug mb-1 capitalize">{d.title}</h2>
                <p className="text-[#D20001] font-semibold text-sm mb-3">{d.empresa}</p>
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
                    <p className="text-xs font-bold text-[#2A0001] uppercase tracking-wider mb-2">{sec.heading}</p>
                    <ul className="space-y-1.5">
                      {sec.lines.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <ChevronRight size={13} className="text-[#D20001] mt-0.5 shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA candidatura */}
              <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-gray-100 space-y-3">
                <p className="text-xs font-bold text-[#2A0001] uppercase tracking-wider">Candidatar-se</p>

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
                            className="w-full bg-white border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#D20001] focus:ring-2 focus:ring-[#D20001]/10 placeholder:text-gray-300 transition-all"
                            onKeyDown={e => { if (e.key === "Enter" && candidateName.trim()) setNameSubmitted(true); }}
                          />
                        </div>
                        <a
                          href={buildMailto(d.appEmail, d.title, d.empresa, candidateName)}
                          onClick={() => { if (candidateName.trim()) setNameSubmitted(true); }}
                          className="flex items-center justify-center gap-2 w-full bg-[#D20001] hover:bg-[#B40001] text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-[#D20001]/30"
                        >
                          <Mail size={16} /> Abrir email de candidatura
                        </a>
                        <p className="text-xs text-center text-gray-400">Abre no Gmail, Outlook ou app de email instalada</p>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-[#D20001]/10 border border-[#D20001]/25 rounded-2xl p-4 flex items-start gap-3">
                          <CheckCircle2 size={20} className="text-[#D20001] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[#D20001] text-sm">Email preparado!</p>
                            <p className="text-xs text-gray-500 mt-0.5">O email foi aberto com o teu nome, assunto e texto já preenchidos. Só anexa o teu CV e envia.</p>
                          </div>
                        </div>
                        <a href={buildMailto(d.appEmail, d.title, d.empresa, candidateName)}
                          className="flex items-center justify-center gap-2 w-full bg-[#D20001]/15 hover:bg-[#D20001]/25 text-[#D20001] font-bold text-sm py-3.5 rounded-xl transition-all border border-[#D20001]/30">
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
                      className="flex items-center justify-center gap-2 w-full bg-[#D20001] hover:bg-[#B40001] text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98]">
                      <ExternalLink size={16} /> Candidatar-se agora
                    </a>
                    <p className="text-xs text-center text-gray-400">Abre o site original da empresa</p>
                  </div>
                )}

                {!d.appEmail && !d.appUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">Consulta as instruções de candidatura na fonte original.</p>
                    <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#4F0101] hover:bg-gray-800 text-white font-bold text-sm py-4 rounded-xl transition-all active:scale-[0.98]">
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSlug, setPendingSlug]     = useState<string | null>(null);
  const nomeUser: string = (user?.user_metadata?.nome as string | undefined) || user?.email?.split("@")[0] || "";
  const [drawerSlug, setDrawerSlug] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setDrawerSlug(null), []);

  /* Carregar vagas ao montar */
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

  function refreshVagas() {
    setVagasFetched(false);
    setVagas([]);
  }

  function openVaga(slug: string) {
    if (!user) { setPendingSlug(slug); setShowAuthModal(true); }
    else { setDrawerSlug(slug); }
  }

  useEffect(() => {
    if (!pendingSlug || showAuthModal) return;
    setDrawerSlug(pendingSlug);
    setPendingSlug(null);
  }, [pendingSlug, showAuthModal]);

  return (
    <div className="bg-white min-h-screen">

      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingSlug(null); }}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
      {drawerSlug && <VagaDrawer slug={drawerSlug} onClose={closeDrawer} nomeUser={nomeUser} />}

      {/* ── HERO ── */}
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/10 text-[#D20001] border border-[#D20001]/20 mb-3">
            Vagas de Emprego
          </span>
          <h1 className="text-2xl sm:text-5xl font-bold text-[#2A0001] mb-2 sm:mb-3 leading-tight">
            Talento encontra <span className="text-[#D20001]">oportunidade</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
            Vagas reais actualizadas em tempo real. Candidata-te directamente por email, sem sair do site.
          </p>
          {/* Stats inline */}
          <div className="flex items-center gap-5 mt-5 flex-wrap">
            {!vagasLoading && vagasFetched && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#D20001] animate-pulse" />
                <span className="font-bold text-[#2A0001]">{vagas.length}</span>
                <span className="text-gray-400">vagas em aberto</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <span className="font-semibold text-[#2A0001]">Candidatura grátis</span>
              <span>· sem mensalidade</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-gray-100 rounded-xl w-fit">
          <span className="text-base">🇲🇿</span>
          <span className="text-sm font-semibold text-[#2A0001]">Vagas em Moçambique</span>
        </div>

        <>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-[#2A0001]">Vagas em aberto</h2>
                {!vagasLoading && vagasFetched && (
                  <span className="badge bg-[#D20001]/10 text-[#D20001] border border-[#D20001]/20">{vagas.length} vagas</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {updatedAt && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {timeAgo(updatedAt)}</span>}
                {vagasFetched && (
                  <button onClick={refreshVagas} className="flex items-center gap-1.5 text-xs font-semibold text-[#D20001] bg-[#D20001]/10 hover:bg-[#D20001]/20 px-3 py-1.5 rounded-full transition-all border border-[#D20001]/20">
                    <RefreshCw size={10}/> Actualizar
                  </button>
                )}
              </div>
            </div>

            {vagasFetched && vagas.length > 0 && (
              <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-[#FFF8F8] border border-amber-100 rounded-xl w-fit">
                <span className="w-2 h-2 rounded-full bg-[#D20001] animate-pulse shrink-0" />
                <span className="text-xs text-gray-500">Fonte: <span className="font-semibold text-[#2A0001]">njobs.co.mz</span> · actualizado a cada hora</span>
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
                    <h3 className="font-bold text-sm sm:text-base text-[#2A0001] leading-snug group-hover:text-[#D20001] transition-colors capitalize">{v.title}</h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-gray-500 text-xs font-semibold">{v.empresa}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={10}/>{v.local}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">{v.categoria}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock size={10}/> <span className="font-medium text-[#2A0001]">{v.prazoLabel}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#D20001] bg-[#D20001]/10 group-hover:bg-[#D20001] group-hover:text-white px-3 py-1.5 rounded-full transition-all">
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
      </section>
    </div>
  );
}
