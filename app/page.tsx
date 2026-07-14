"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Zap, Globe, Trophy, Star,
} from "lucide-react";

// Sistema de 2 tons — dourado (destaque) e grafite (neutro), alternados para
// distinguir os cards sem sair da identidade da marca.
const GOLD_ICON = "bg-gradient-to-br from-[#FE0000] to-[#4F0101]";
const GRAPHITE_ICON = "bg-gradient-to-br from-[#2A2A2A] to-[#4F0101]";

const trust = [
  { num: "200+", label: "Candidatos apoiados",  target: 200, suffix: "+" },
  { num: "40+",  label: "Vagas actualizadas / semana", target: 40,  suffix: "+" },
  { num: "200",  label: "MT por serviço", target: 200, suffix: "" },
  { num: "98%",  label: "Satisfação",            target: 98,  suffix: "%" },
];

const whyUs = [
  { Icon: Zap,    bg: "from-[#FFF1F1] to-[#FFF1F1]", iconBg: GOLD_ICON,     iconColor: "text-[#FFFFFF]", border: "border-[#FE0000]/40", title: "Rápido & Acessível",  desc: "Vê as vagas, candidata-te em minutos. Cria o teu CV e paga só quando quiseres descarregar." },
  { Icon: Globe,  bg: "from-gray-50 to-gray-100",     iconBg: GRAPHITE_ICON, iconColor: "text-white",     border: "border-gray-200",    title: "Vagas Reais em Moçambique", desc: "Fontes actualizadas todos os dias, candidatura directa por email, sem intermediários." },
  { Icon: Trophy, bg: "from-[#FFF1F1] to-[#FFF1F1]", iconBg: GOLD_ICON,     iconColor: "text-[#FFFFFF]", border: "border-[#FE0000]/40", title: "Preço Único e Claro", desc: "200 MT por serviço, sempre o mesmo valor. Sem mensalidade, sem surpresas." },
];

const testimonials = [
  { text: "Criei o meu CV em minutos e já recebi resposta de duas empresas na mesma semana.", name: "Carlos M.", role: "Maputo" },
  { text: "Gostei de poder experimentar antes de pagar. Só paguei quando decidi descarregar o CV.", name: "Anita F.", role: "Matola" },
  { text: "As vagas são reais e a candidatura por email poupa-me imenso tempo.", name: "Pedro S.", role: "Beira" },
];

// ── AnimatedCounter ──
function AnimatedCounter({ target, suffix, className }: { target: number; suffix: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return <span ref={ref} className={className}>{display}{suffix}</span>;
}

// ── Section wrapper ──
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <>

      {/* ── HERO ── */}
      {/* Leve de propósito: sem canvas, sem parallax por rato, sem blur pesado
          empilhado, sem animações em loop infinito — só CSS estático + um
          único reveal de entrada. Igual em mobile e desktop. */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #1A0000 0%, #3A0001 45%, #280001 72%, #0C0000 100%)",
        }}
      >
        {/* Foto de fundo — desfocada, minimalista. next/image trata do
            redimensionamento certo por dispositivo (sizes abaixo) e serve
            AVIF/WebP automaticamente — leve tanto em mobile como desktop. */}
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          priority
          quality={60}
          sizes="100vw"
          className="object-cover scale-110 blur-md"
        />
        {/* Sobreposição escura — mantém a identidade verde-esmeralda/turquesa e a legibilidade do texto branco */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(26,0,0,0.92) 0%, rgba(58,1,1,0.90) 45%, rgba(40,1,1,0.93) 72%, rgba(12,0,0,0.95) 100%)",
          }}
        />

        {/* Um único glow estático — blur-3xl (64px) em vez dos 3 blur-[130px] empilhados anteriores */}
        <div
          className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #FE0000, transparent 70%)" }}
        />

        {/* Grelha de hairlines — estática, sem animação */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(210,0,1,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(210,0,1,0.045) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, #000 40%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, #000 40%, transparent 90%)",
          }}
        />

        {/* Textura de grão fina — estática, custo mínimo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "140px 140px",
          }}
        />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          {/* Texto hero */}
          <div>
            <h1 className="text-[clamp(2.6rem,6.5vw,5rem)] text-white leading-[1.05] mb-5 tracking-tight">
              {/* Linha 1 */}
              <span className="block overflow-hidden">
                <span className="block">
                  Encontre a vaga certa
                </span>
              </span>
              {/* Linha 2 — gradiente vivo */}
              <span className="block overflow-hidden">
                <span
                  className="block bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(100deg, #FE0000 0%, #D20001 45%, #4F0101 100%)" }}
                >
                  e o CV que a conquista.
                </span>
              </span>
            </h1>

            <p className="text-white/75 text-base leading-relaxed mb-8 max-w-md">
              Vagas reais em Moçambique, candidatura sempre gratuita, mais um CV que aumenta as tuas hipóteses de resposta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link
                href="/emprego"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-7 py-4 rounded-2xl transition-all active:scale-95 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(135deg, #FE0000 0%, #D20001 55%, #4F0101 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 14px 34px -8px rgba(210,0,1,0.5), 0 0 0 1px rgba(254,0,0,0.35) inset",
                }}
              >
                Ver Vagas Grátis →
              </Link>
              <Link
                href="/curriculum"
                className="inline-flex items-center justify-center gap-2 text-white/90 font-semibold text-base px-7 py-4 rounded-2xl transition-all active:scale-95 hover:scale-[1.03] hover:text-white"
                style={{
                  background: "rgba(210,0,1,0.08)",
                  border: "1px solid rgba(210,0,1,0.30)",
                }}
              >
                Criar CV
              </Link>
            </div>

            <p className="text-white/60 text-xs mb-10">
              Candidaturas 100% gratuitas · Experimenta o CV grátis, só pagas <span className="font-semibold" style={{ color: "#FE0000" }}>200 MT</span> quando fores descarregar · Sem mensalidades
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
              {trust.map(({ label, target, suffix }, i) => {
                const colors = ["#FE0000", "#ED1D1D", "#D20001", "#D20001"];
                return (
                  <div key={label}>
                    <div className="text-2xl font-bold" style={{ color: colors[i % colors.length] }}>
                      <AnimatedCounter target={target} suffix={suffix} />
                    </div>
                    <div className="text-white/60 text-xs mt-1 leading-tight">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── DOIS PÚBLICOS ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#FFF8F8]">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 gap-4">
          <div>
            <Link href="/emprego" className="group relative rounded-3xl overflow-hidden bg-[#4F0101] p-8 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300 block h-full">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #D20001, transparent 70%)" }} />
              <span className="relative inline-flex items-center gap-2 bg-[#D20001]/20 text-[#D20001] text-xs font-bold px-3 py-1.5 rounded-full w-fit border border-[#D20001]/30">
                <span className="w-1.5 h-1.5 bg-[#D20001] rounded-full animate-pulse" /> Para profissionais
              </span>
              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Procuras<br />emprego?</h3>
                <p className="text-white/45 text-sm leading-relaxed">Vagas reais em Moçambique, email pré-preenchido, CV em anexo. Candidatura 100% gratuita, sem mensalidades.</p>
              </div>
              <div className="relative flex items-center gap-2 text-[#D20001] font-bold text-sm group-hover:gap-3 transition-all">
                Ver vagas disponíveis <span>→</span>
              </div>
            </Link>
          </div>

          <div>
            <Link href="/curriculum" className="group relative rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm p-8 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300 hover:shadow-md hover:border-[#D20001]/20 block h-full">
              <span className="inline-flex items-center gap-2 bg-[#D20001]/10 text-[#D20001] text-xs font-bold px-3 py-1.5 rounded-full w-fit border border-[#D20001]/20">
                <span className="w-1.5 h-1.5 bg-[#D20001] rounded-full" /> Para candidatos
              </span>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2A0001] mb-2">Precisas de<br />um CV melhor?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Cria, melhora e adapta o teu CV. Experimenta grátis, só pagas 200 MT quando fores descarregar.</p>
              </div>
              <div className="flex items-center gap-2 text-[#D20001] font-bold text-sm group-hover:gap-3 transition-all">
                Criar CV <span>→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PORQUÊ MUIANGA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Section>
            <div className="text-center mb-14">
              <span className="badge bg-[#D20001]/10 text-[#D20001] mb-3 border border-[#D20001]/20">Porquê escolher-nos</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#2A0001] max-w-2xl mx-auto">
                Uma plataforma feita<br /><span className="text-[#D20001]">para Moçambique</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whyUs.map(({ Icon, bg, iconBg, iconColor, border, title, desc }) => (
                <div key={title} className={`premium-card rounded-2xl bg-gradient-to-br ${bg} border ${border} p-8`}>
                  <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
                    <Icon size={22} className={iconColor} />
                  </div>
                  <h3 className="font-bold text-xl text-[#2A0001] mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── VAGAS CTA ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#FFF8F8]">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{ background: "linear-gradient(135deg, #0A0A0F 0%, #0D0B08 100%)" }}
          >
            <div>
              <span className="badge bg-white/8 text-white/40 mb-3 border border-white/10">Para profissionais</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Candidatura inteligente, sempre grátis</h3>
              <p className="text-white/40 text-sm max-w-md leading-relaxed mb-3">O email já vem pré-preenchido com o teu nome, a vaga e o corpo do texto. Só precisas de anexar o CV, sem mensalidade, sem pegadinhas.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white/70 text-xs font-semibold">Candidatura sem custo, todas as vagas</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-white/35 text-xs">Quer destacar-te? Cria um CV por 200 MT.</span>
              </div>
            </div>
            <Link href="/emprego" className="shrink-0 btn-primary text-base px-8 py-4 rounded-2xl">Ver Vagas em aberto →</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Section>
            <div className="text-center mb-12">
              <span className="badge bg-[#D20001]/10 text-[#D20001] mb-3 border border-[#D20001]/20">O que dizem os clientes</span>
              <h2 className="text-3xl sm:text-4xl text-[#2A0001]">Resultados reais,<br /><span className="text-[#D20001]">clientes reais</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map(({ text, name, role }) => (
                <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#D20001]/20 transition-all">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-[#D20001] fill-[#D20001]" />)}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">"{text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-[#D20001]/15 flex items-center justify-center font-bold text-[#D20001] text-sm border border-[#D20001]/20">{name[0]}</div>
                    <div>
                      <p className="font-semibold text-sm text-[#2A0001]">{name}</p>
                      <p className="text-xs text-gray-400">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF8F8]">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #D20001 0%, #D4B255 40%, #A8893E 100%)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "white" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "#4F0101" }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl text-white mb-4 leading-tight drop-shadow-sm">Começa hoje.<br />Cresce connosco.</h2>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Junta-te aos candidatos em Moçambique que já confiam na MUIANGA para encontrar emprego e criar um CV melhor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/curriculum" className="inline-flex items-center justify-center gap-2 bg-white text-[#D20001] font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/95 transition-all hover:shadow-xl active:scale-95">
                Criar CV →
              </Link>
              <Link href="/emprego" className="inline-flex items-center justify-center gap-2 bg-[#4F0101]/20 backdrop-blur text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-[#4F0101]/30 transition-all border border-white/30">
                Ver Vagas de Emprego →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
