"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import NetworkBackground from "@/components/premium/NetworkBackground";
import GoldParticles from "@/components/premium/GoldParticles";
import RadialLights from "@/components/premium/RadialLights";
import HeroProductPreview from "@/components/premium/HeroProductPreview";
import FloatingCareerIcons from "@/components/premium/FloatingCareerIcons";
import HeroParallaxLayer from "@/components/premium/HeroParallaxLayer";
import { useIsMobile } from "@/lib/use-is-mobile";
import {
  FileText, Mic, Monitor, FileUser, GraduationCap, Palette,
  Zap, Globe, Trophy, Star,
  type LucideIcon,
} from "lucide-react";

type ServiceCard = {
  Icon: LucideIcon; iconBg: string; iconColor: string; title: string; tag: string; tagColor: string;
  desc: string;        // o que resolve — em 1 linha
  href: string;        // liga directamente ao detalhe certo em /servicos
};

const services: ServiceCard[] = [
  { Icon: FileText,      iconBg: "bg-gradient-to-br from-orange-400 to-red-500",     iconColor: "text-white", title: "Plano de Negócio",
    desc: "Análise de mercado, projecções financeiras e estratégia — pronto para apresentar a bancos e investidores.",
    tag: "Popular",  tagColor: "bg-orange-500 text-white", href: "/servicos?ver=" + encodeURIComponent("Plano de Negócio") },
  { Icon: Mic,           iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-500", iconColor: "text-white", title: "Palestra Motivacional",
    desc: "Palestras de impacto para empresas, universidades e eventos — liderança, empreendedorismo, lusofonia.",
    tag: "Destaque", tagColor: "bg-fuchsia-500 text-white", href: "/servicos?ver=" + encodeURIComponent("Palestra Motivacional") },
  { Icon: Monitor,       iconBg: "bg-gradient-to-br from-cyan-400 to-blue-500",      iconColor: "text-white", title: "Aulas de Informática",
    desc: "Do básico ao avançado, para crianças, adultos e profissionais — presencial, com certificado.",
    tag: "Novo",     tagColor: "bg-emerald-500 text-white", href: "/servicos?categoria=" + encodeURIComponent("Aulas de Informática") },
  { Icon: FileUser,      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",    iconColor: "text-white", title: "CV & Candidaturas",
    desc: "CV profissional, carta de motivação e LinkedIn — feito para te destacares na pilha de candidaturas.",
    tag: "Rápido",   tagColor: "bg-cyan-500 text-white", href: "/servicos?ver=" + encodeURIComponent("CV & Candidaturas") },
  { Icon: GraduationCap, iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",   iconColor: "text-white", title: "Apoio a Monografias",
    desc: "Orientação metodológica, revisão de capítulos e formatação — para uma monografia aprovada com qualidade.",
    tag: "Popular",  tagColor: "bg-orange-500 text-white", href: "/servicos?ver=" + encodeURIComponent("Apoio a Monografias") },
  { Icon: Palette,       iconBg: "bg-gradient-to-br from-pink-500 to-rose-500",      iconColor: "text-white", title: "Branding Completo",
    desc: "Logótipo, paleta de cores, tipografia e manual de marca — identidade visual profissional e memorável.",
    tag: "Destaque", tagColor: "bg-fuchsia-500 text-white", href: "/servicos?ver=" + encodeURIComponent("Branding Completo") },
];


const trust = [
  { num: "200+", label: "Candidatos apoiados",  target: 200, suffix: "+" },
  { num: "40+",  label: "Vagas actualizadas / semana", target: 40,  suffix: "+" },
  { num: "6",    label: "Países lusófonos",      target: 6,   suffix: "" },
  { num: "98%",  label: "Satisfação",            target: 98,  suffix: "%" },
];

const whyUs = [
  { Icon: Zap,    bg: "from-orange-100 to-pink-100",    iconBg: "bg-gradient-to-br from-orange-400 to-pink-500",  iconColor: "text-white",  border: "border-orange-300",  title: "Rápido & Acessível",  desc: "Solicita online, recebe proposta em 24h e começa em dias. Sem burocracia." },
  { Icon: Globe,  bg: "from-cyan-100 to-emerald-100",   iconBg: "bg-gradient-to-br from-cyan-400 to-emerald-500", iconColor: "text-white", border: "border-cyan-300", title: "Rede PALOP & Lusofonia", desc: "Presente em MZ, Angola, Cabo Verde, Brasil e Portugal. O teu talento sem fronteiras lusófonas." },
  { Icon: Trophy, bg: "from-purple-100 to-fuchsia-100", iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-500", iconColor: "text-white", border: "border-purple-300", title: "Qualidade Garantida", desc: "Mais de 200 projectos entregues com excelência. Satisfação ou devolvemos." },
];

const testimonials = [
  { text: "A consultoria estratégica da MUIANGA transformou completamente a forma como gerimos o nosso negócio.", name: "Carlos M.", role: "CEO, Maputo" },
  { text: "Fizemos o plano de negócio com eles e conseguimos financiamento em menos de 3 meses. Recomendo!", name: "Anita F.", role: "Empreendedora, Matola" },
  { text: "As aulas de informática para a minha equipa foram excelentes. Profissionais e pontuais.", name: "Pedro S.", role: "Director, Beira" },
];

// ── Animation variants ──
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const fadeLeft: Variants  = { hidden: { opacity: 0, x: -32 }, show: { opacity: 1, x: 0, transition: { duration: 0.55 } } };
const fadeRight: Variants = { hidden: { opacity: 0, x: 32  }, show: { opacity: 1, x: 0, transition: { duration: 0.55 } } };
const stagger: Variants   = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const cardItem: Variants  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ── AnimatedCounter ──
function AnimatedCounter({ target, suffix, className }: { target: number; suffix: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (prefersReduced) { setDisplay(target); return; }
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target, prefersReduced]);

  return <span ref={ref} className={className}>{display}{suffix}</span>;
}

// ── Section wrapper ──
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobile();
  return (
    <>

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0A0908 0%, #14110A 45%, #100D08 72%, #080706 100%)",
        }}
      >
        {/* Camadas decorativas pesadas (canvas, blur, glassmorphism) só em desktop — mobile fica leve e simples */}
        {!isMobile && (
          <>
            <NetworkBackground
              density={0.00002}
              linkDistance={130}
              className="[mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,transparent_35%,#000_85%)] [-webkit-mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,transparent_35%,#000_85%)]"
            />
            <RadialLights />
          </>
        )}
        <GoldParticles className="z-[1]" density={isMobile ? 0.00002 : 0.00006} lightweight={isMobile} />

        {/* Grid animada — hairlines dourados subtis (estático em mobile, poupa CPU) */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.045) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, #000 40%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, #000 40%, transparent 90%)",
            opacity: isMobile ? 0.4 : undefined,
          }}
          animate={prefersReduced || isMobile ? {} : { opacity: [0.3, 0.55, 0.3] }}
          transition={prefersReduced || isMobile ? {} : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Halo dourado — 1 em mobile (leve), 3 em desktop (profundidade) */}
        <div className="absolute top-[-18%] right-[-8%] w-[620px] h-[620px] rounded-full opacity-[0.22] blur-[130px] pointer-events-none" style={{ background: "radial-gradient(circle, #E8C766, transparent 70%)" }} />
        {!isMobile && (
          <>
            <div className="absolute bottom-[-12%] left-[-6%] w-[480px] h-[480px] rounded-full opacity-[0.16] blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #A87C2E, transparent 70%)" }} />
            <div className="absolute top-[38%] left-[42%] w-[400px] h-[400px] rounded-full opacity-[0.10] blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }} />
          </>
        )}

        {/* Textura de grão fina — estática, custo mínimo, mantida em ambos */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "140px 140px",
          }}
        />

        {/* Ícones vectoriais flutuantes — já ocultos em mobile (hidden md:block) */}
        <FloatingCareerIcons />

        <HeroParallaxLayer strength={10}>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          {/* Texto hero */}
          <motion.div
            className="order-2 lg:order-1"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {/* Eyebrow — tags padronizadas em dourado (disciplina monocromática) */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2 mb-5">
              {["Vagas", "CV Profissional", "Carreira"].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: "rgba(201,168,76,0.10)", color: "#E8C766", border: "1px solid rgba(201,168,76,0.28)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C9A84C" }} />
                  {label}
                </span>
              ))}
            </motion.div>

            <h1 className="text-[clamp(2.6rem,6.5vw,5rem)] text-white leading-[1.05] mb-5 tracking-tight">
              {/* Linha 1 — text reveal mask */}
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  Encontre o emprego
                </motion.span>
              </span>
              {/* Linha 2 — reveal com delay + gradiente vivo */}
              <span className="block overflow-hidden">
                <motion.span
                  className="block bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(100deg, #E8C766 0%, #C9A84C 45%, #A87C2E 100%)" }}
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  que muda a sua vida.
                </motion.span>
              </span>
            </h1>

            <motion.p variants={fadeUp} className="text-white/75 text-base leading-relaxed mb-8 max-w-md">
              Vagas actualizadas, CV profissional em minutos e candidaturas assistidas — de Maputo aos <span className="text-white font-medium">PALOP, Brasil e Portugal</span>.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link
                href="/emprego"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-7 py-4 rounded-2xl transition-all active:scale-95 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(135deg, #E8C766 0%, #C9A84C 55%, #A87C2E 100%)",
                  color: "#1A1408",
                  boxShadow: "0 14px 34px -8px rgba(201,168,76,0.5), 0 0 0 1px rgba(232,199,102,0.35) inset",
                }}
              >
                Encontrar Emprego →
              </Link>
              <Link
                href="/curriculum"
                className="inline-flex items-center justify-center gap-2 text-white/90 font-semibold text-base px-7 py-4 rounded-2xl transition-all active:scale-95 hover:scale-[1.03] hover:text-white"
                style={{
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.30)",
                }}
              >
                Criar CV Profissional
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="text-white/60 text-xs mb-10">
              Candidatura assistida · Acesso premium a partir de <span className="font-semibold" style={{ color: "#E8C766" }}>199 MT/mês</span> · Cancela quando quiseres
            </motion.p>

            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
              {trust.map(({ label, target, suffix }, i) => {
                const colors = ["#E8C766", "#D4AF37", "#C9A84C", "#10B981"];
                return (
                  <div key={label}>
                    <div className="text-2xl font-bold" style={{ color: colors[i % colors.length] }}>
                      <AnimatedCounter target={target} suffix={suffix} />
                    </div>
                    <div className="text-white/60 text-xs mt-1 leading-tight">{label}</div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Preview do produto — feed de vagas (substitui o wordmark gigante) */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <HeroProductPreview />
          </div>
        </div>
        </HeroParallaxLayer>
      </section>

      {/* ── DOIS PÚBLICOS ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 gap-4">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
            variants={fadeLeft}
          >
            <Link href="/emprego" className="group relative rounded-3xl overflow-hidden bg-[#0D0D0D] p-8 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300 block h-full">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }} />
              <span className="relative inline-flex items-center gap-2 bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold px-3 py-1.5 rounded-full w-fit border border-[#C9A84C]/30">
                <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse" /> Para profissionais
              </span>
              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Procuras<br />emprego?</h3>
                <p className="text-white/45 text-sm leading-relaxed">Candidata-te a vagas reais em MZ e abroad — email pré-preenchido, CV em anexo. Rápido e profissional.</p>
              </div>
              <div className="relative flex items-center gap-2 text-[#C9A84C] font-bold text-sm group-hover:gap-3 transition-all">
                Ver vagas disponíveis <span>→</span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
            variants={fadeRight}
          >
            <Link href="/servicos" className="group relative rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm p-8 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300 hover:shadow-md hover:border-[#C9A84C]/20 block h-full">
              <span className="inline-flex items-center gap-2 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-bold px-3 py-1.5 rounded-full w-fit border border-[#1D9E75]/20">
                <span className="w-1.5 h-1.5 bg-[#1D9E75] rounded-full" /> Para empresas
              </span>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#0D0D0D] mb-2">Precisas de<br />consultoria?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Planos de negócio, branding, formação, monografias e muito mais — propostas em 24h, sem burocracia.</p>
              </div>
              <div className="flex items-center gap-2 text-[#C9A84C] font-bold text-sm group-hover:gap-3 transition-all">
                Ver serviços e preços <span>→</span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── SERVIÇOS ── */}
      <section className="bg-[#F8F5EF] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="badge bg-[#C9A84C]/12 text-[#C9A84C] mb-3 border border-[#C9A84C]/20">Marketplace de Serviços</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#0D0D0D]">
                  O que podes solicitar<br /><span className="text-[#C9A84C]">hoje mesmo</span>
                </h2>
              </div>
              <Link href="/servicos" className="btn-dark shrink-0 self-start sm:self-auto">Ver todos (21+) →</Link>
            </motion.div>

            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={stagger}>
              {services.map(({ Icon, iconBg, iconColor, title, tag, tagColor, desc, href }) => (
                <motion.div key={title} variants={cardItem}>
                  <Link href={href} className="service-card premium-card group flex flex-col h-full">
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <span className={`badge ${tagColor}`}>{tag}</span>
                    </div>
                    <h3 className="font-bold text-lg text-[#0D0D0D] group-hover:text-[#C9A84C] transition-colors">{title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed flex-1">{desc}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ver detalhes</span>
                      <span className="text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 px-3 py-1 rounded-full group-hover:bg-[#1D9E75]/20 transition-colors">Saber mais →</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1A1208 100%)" }}>
              <div>
                <h3 className="text-white text-2xl font-bold mb-1">Não encontras o que precisas?</h3>
                <p className="text-white/40 text-sm">Fala connosco — criamos soluções à medida para o teu negócio.</p>
              </div>
              <Link href="/contacto" className="btn-primary shrink-0 text-base px-8 py-4 rounded-2xl">Falar Connosco →</Link>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── PORQUÊ MUIANGA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="badge bg-[#1D9E75]/10 text-[#1D9E75] mb-3 border border-[#1D9E75]/20">Porquê escolher-nos</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#0D0D0D] max-w-2xl mx-auto">
                Uma plataforma feita<br /><span className="text-[#C9A84C]">para o mundo lusófono</span>
              </h2>
            </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={stagger}>
              {whyUs.map(({ Icon, bg, iconBg, iconColor, border, title, desc }) => (
                <motion.div key={title} variants={cardItem} className={`premium-card rounded-2xl bg-gradient-to-br ${bg} border ${border} p-8`}>
                  <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
                    <Icon size={22} className={iconColor} />
                  </div>
                  <h3 className="font-bold text-xl text-[#0D0D0D] mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── VAGAS CTA ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            className="rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{ background: "linear-gradient(135deg, #0A0A0F 0%, #0D0B08 100%)" }}
          >
            <div>
              <span className="badge bg-white/8 text-white/40 mb-3 border border-white/10">Para profissionais</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Candidatura inteligente</h3>
              <p className="text-white/40 text-sm max-w-md leading-relaxed mb-3">O email já vem pré-preenchido com o teu nome, a vaga e o corpo do texto. Só precisas de anexar o CV.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-[#C9A84C] text-2xl font-bold">199 MT</span>
                  <span className="text-white/30 text-xs">/mês</span>
                </div>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-white/35 text-xs">Imprimir e enviar CV custa mais. Aqui candidatas-te a todas as vagas.</span>
              </div>
            </div>
            <Link href="/emprego" className="shrink-0 btn-primary text-base px-8 py-4 rounded-2xl">Ver Vagas em aberto →</Link>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] mb-3 border border-[#C9A84C]/20">O que dizem os clientes</span>
              <h2 className="text-3xl sm:text-4xl text-[#0D0D0D]">Resultados reais,<br /><span className="text-[#C9A84C]">clientes reais</span></h2>
            </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={stagger}>
              {testimonials.map(({ text, name, role }) => (
                <motion.div key={name} variants={cardItem} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#C9A84C]/20 transition-all">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-[#C9A84C] fill-[#C9A84C]" />)}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">"{text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-[#C9A84C]/15 flex items-center justify-center font-bold text-[#C9A84C] text-sm border border-[#C9A84C]/20">{name[0]}</div>
                    <div>
                      <p className="font-semibold text-sm text-[#0D0D0D]">{name}</p>
                      <p className="text-xs text-gray-400">{role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F5EF]">
        <motion.div
          className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #C9A84C 0%, #D4B255 40%, #A8893E 100%)" }}
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "white" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "#0D0D0D" }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl text-white mb-4 leading-tight drop-shadow-sm">Começa hoje.<br />Cresce connosco.</h2>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Junta-te a profissionais e empresas de Moçambique, Angola, Cabo Verde, Brasil, Portugal e dos PALOP que já confiam na MUIANGA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/servicos" className="inline-flex items-center justify-center gap-2 bg-white text-[#C9A84C] font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/95 transition-all hover:shadow-xl active:scale-95">
                Ver todos os Serviços →
              </Link>
              <Link href="/emprego" className="inline-flex items-center justify-center gap-2 bg-[#0D0D0D]/20 backdrop-blur text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-[#0D0D0D]/30 transition-all border border-white/30">
                Ver Boladas
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
