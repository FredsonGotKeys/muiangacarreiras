import Link from "next/link";
import Image from "next/image";
import FloatingFounderAvatar from "@/components/FloatingFounderAvatar";
import {
  FileText, Mic, Monitor, FileUser, GraduationCap, Palette,
  Headphones, PenTool, Globe2, Share2,
  Zap, Globe, Trophy, Star,
  type LucideIcon,
} from "lucide-react";

type ServiceCard = { Icon: LucideIcon; iconBg: string; iconColor: string; title: string; price: string; tag: string; tagColor: string };
type BoladaCard = { Icon: LucideIcon; title: string; valor: string; prazo: string };

const services: ServiceCard[] = [
  { Icon: FileText,      iconBg: "bg-amber-50",  iconColor: "text-amber-600",  title: "Plano de Negócio",      price: "15.000 MT",   tag: "Popular",  tagColor: "bg-amber-100 text-amber-700" },
  { Icon: Mic,           iconBg: "bg-violet-50", iconColor: "text-violet-600", title: "Palestra Motivacional",  price: "Sob consulta", tag: "Destaque", tagColor: "bg-violet-100 text-violet-700" },
  { Icon: Monitor,       iconBg: "bg-sky-50",    iconColor: "text-sky-600",    title: "Aulas de Informática",  price: "2.500 MT/mês", tag: "Novo",     tagColor: "bg-emerald-100 text-emerald-700" },
  { Icon: FileUser,      iconBg: "bg-blue-50",   iconColor: "text-blue-600",   title: "CV Profissional",       price: "1.500 MT",    tag: "Rápido",   tagColor: "bg-blue-100 text-blue-700" },
  { Icon: GraduationCap, iconBg: "bg-orange-50", iconColor: "text-orange-600", title: "Apoio a Monografia",    price: "5.000 MT",    tag: "Popular",  tagColor: "bg-amber-100 text-amber-700" },
  { Icon: Palette,       iconBg: "bg-rose-50",   iconColor: "text-rose-500",   title: "Branding & Identidade", price: "8.000 MT",    tag: "Destaque", tagColor: "bg-violet-100 text-violet-700" },
];

const boladas: BoladaCard[] = [
  { Icon: Headphones, title: "Transcrição de áudio (PT)",       valor: "800 MT",   prazo: "3 dias" },
  { Icon: PenTool,    title: "Design de cartaz para evento",     valor: "1.200 MT", prazo: "2 dias" },
  { Icon: Globe2,     title: "Tradução EN→PT técnico",           valor: "1.500 MT", prazo: "5 dias" },
  { Icon: Share2,     title: "Gestão de redes sociais (1 sem.)", valor: "2.000 MT", prazo: "7 dias" },
];

const trust = [
  { num: "200+", label: "Projectos entregues" },
  { num: "10+",  label: "Anos de experiência" },
  { num: "3",    label: "Países: MZ · PT · ZA" },
  { num: "98%",  label: "Clientes satisfeitos" },
];

const whyUs = [
  { Icon: Zap,    bg: "from-amber-50 to-amber-100/50",   iconBg: "bg-amber-100",  iconColor: "text-amber-600",  border: "border-amber-200/60", title: "Rápido & Acessível",  desc: "Solicita online, recebe proposta em 24h e começa em dias. Sem burocracia." },
  { Icon: Globe,  bg: "from-emerald-50 to-emerald-100/50", iconBg: "bg-emerald-100", iconColor: "text-[#1D9E75]", border: "border-emerald-200/60", title: "Rede PALOP & Lusofonia", desc: "Presente em MZ, Angola, Cabo Verde, Brasil e Portugal. O teu talento sem fronteiras lusófonas." },
  { Icon: Trophy, bg: "from-violet-50 to-violet-100/50", iconBg: "bg-violet-100", iconColor: "text-violet-600", border: "border-violet-200/60", title: "Qualidade Garantida", desc: "Mais de 200 projectos entregues com excelência. Satisfação ou devolvemos." },
];

const testimonials = [
  { text: "A consultoria estratégica da MUIANGA transformou completamente a forma como gerimos o nosso negócio.", name: "Carlos M.", role: "CEO, Maputo" },
  { text: "Fizemos o plano de negócio com eles e conseguimos financiamento em menos de 3 meses. Recomendo!", name: "Anita F.", role: "Empreendedora, Matola" },
  { text: "As aulas de informática para a minha equipa foram excelentes. Profissionais e pontuais.", name: "Pedro S.", role: "Director, Beira" },
];

export default function HomePage() {
  return (
    <>
      <FloatingFounderAvatar />
      {/* ── HERO ── */}
      <section className="relative bg-[#080808] min-h-screen flex items-center overflow-hidden">
        {/* Gold glow top-right */}
        <div className="absolute top-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-[0.18] blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }} />
        {/* Green glow bottom-left */}
        <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.14] blur-[100px] pointer-events-none" style={{ background: "radial-gradient(circle, #1D9E75, transparent 70%)" }} />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">

            <h1 className="text-[clamp(3rem,7.5vw,5.5rem)] text-white leading-[0.95] mb-5 tracking-tight">
              <span className="text-[#C9A84C]">MUIANGA</span><br />
              <span className="font-light text-white/40 text-[0.42em] tracking-[0.35em] uppercase">Consultores</span>
            </h1>
            <p className="text-white/50 text-lg font-light leading-relaxed mb-2">Consultoria · Formação · Emprego</p>
            <p className="text-white/50 text-sm leading-relaxed mb-9 max-w-md">
              A plataforma moçambicana que une talento, negócio e oportunidade — de Maputo aos <span className="text-white/75 font-medium">PALOP, Brasil e Portugal</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/servicos" className="btn-primary text-base px-8 py-4 rounded-2xl justify-center">
                Ver Serviços e Preços
              </Link>
              <Link href="/emprego" className="inline-flex items-center justify-center gap-2 bg-white/6 border border-[#C9A84C]/25 text-[#C9A84C] font-semibold text-base px-8 py-4 rounded-2xl hover:bg-[#C9A84C]/12 hover:border-[#C9A84C]/40 transition-all active:scale-95">
                Boladas Disponíveis
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/8">
              {trust.map(({ num, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-[#C9A84C]">{num}</div>
                  <div className="text-white/30 text-xs mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm lg:max-w-md">
              <div className="absolute inset-0 bg-[#C9A84C] opacity-15 blur-3xl rounded-3xl scale-95" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[3/4]">
                <Image src="/images/fredson-muianga.jpg" alt="Liderança MUIANGA CONSULTORES" fill className="object-cover object-top" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-[#080808]/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm">"Moçambique tem talento.</p>
                  <p className="text-[#C9A84C] font-semibold text-sm">A MUIANGA é a ponte."</p>
                  <p className="text-white/25 text-xs mt-2">MUIANGA CONSULTORES · Maputo</p>
                </div>
              </div>
              <div className="absolute -right-3 top-1/3 flex flex-col gap-2">
                {["MZ","AO","BR","PT"].map(c => (
                  <div key={c} className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center shadow-lg shadow-[#C9A84C]/30">
                    <span className="text-[9px] font-bold text-[#0D0D0D]">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-[#C9A84C] py-3 overflow-hidden border-y border-[#B8943E]">
        <div className="flex gap-8 animate-marquee whitespace-nowrap w-max">
          {Array(6).fill(["Consultoria Estratégica —", "Formação & Palestras —", "BOLADAS —", "MZ · AO · CV · ST · GW —", "Brasil & Portugal —", "Monografias —", "Aulas de Informática —", "Branding —", "PALOP & Lusofonia —", "Vagas de Emprego —"]).flat().map((t, i) => (
            <span key={i} className="text-[#0D0D0D] font-bold text-sm px-4 tracking-widest uppercase">{t}</span>
          ))}
        </div>
      </div>

      {/* ── BOLADAS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0D0D0D]">
        {/* glow dourado forte no topo */}
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none rounded-full" style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.18) 0%, transparent 70%)" }} />
        {/* linha decorativa topo */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

        <div className="relative max-w-7xl mx-auto">

          {/* Cabeçalho */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 border border-[#C9A84C]/35 rounded-full px-4 py-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
                <span className="text-[#C9A84C] text-xs font-bold tracking-wider uppercase">5 boladas disponíveis agora</span>
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#C9A84C] tracking-tight leading-none">BOLADAS</h2>
                <span className="text-white/50 text-lg font-light tracking-[0.25em] uppercase">by MUIANGA</span>
              </div>
              <p className="text-white/65 text-base mt-4 max-w-xl leading-relaxed">
                Micro-trabalhos pagos para a comunidade lusófona — MZ, AO, CV, BR, PT e mais. Candidata-te, executa e recebe.
              </p>
            </div>
            <Link href="/emprego" className="shrink-0 btn-primary self-start lg:self-auto px-7 py-3.5 text-base">
              Ver todas as Boladas
            </Link>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {boladas.map(({ Icon, title, valor, prazo }) => (
              <Link key={title} href="/emprego"
                className="group bg-white/[0.06] border border-white/[0.12] rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/[0.10] hover:border-[#C9A84C]/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-[#C9A84C]/20 rounded-xl flex items-center justify-center group-hover:bg-[#C9A84C]/30 transition-colors border border-[#C9A84C]/25">
                    <Icon size={20} className="text-[#C9A84C]" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#1D9E75]/20 text-[#4ADE80] border border-[#1D9E75]/30">Aberto</span>
                </div>
                <p className="font-semibold text-white text-sm leading-snug group-hover:text-[#C9A84C] transition-colors flex-1">{title}</p>
                <div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/15">{prazo}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-[#C9A84C] font-bold text-base">{valor}</span>
                  <span className="text-xs text-white/45 group-hover:text-[#C9A84C] transition-colors font-semibold">Candidatar →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Strip de info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { Icon: Zap,      title: "Registo gratuito",  desc: "Cria o teu perfil e candida-te sem custos." },
              { Icon: FileText, title: "Pagamento directo", desc: "Recebe o valor acordado após entrega aprovada." },
              { Icon: Globe,    title: "100% remoto",        desc: "Trabalha de qualquer país lusófono." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white/[0.04] border border-white/[0.09] rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                <div className="w-9 h-9 bg-[#C9A84C]/20 rounded-lg flex items-center justify-center shrink-0 border border-[#C9A84C]/25">
                  <Icon size={16} className="text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ── */}
      <section className="bg-[#F8F5EF] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="badge bg-[#C9A84C]/12 text-[#C9A84C] mb-3 border border-[#C9A84C]/20">Marketplace de Serviços</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#0D0D0D]">
                O que podes solicitar<br /><span className="text-[#C9A84C]">hoje mesmo</span>
              </h2>
            </div>
            <Link href="/servicos" className="btn-dark shrink-0 self-start sm:self-auto">Ver todos (21+) →</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(({ Icon, iconBg, iconColor, title, price, tag, tagColor }) => (
              <Link href="/servicos" key={title} className="service-card group">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <span className={`badge ${tagColor}`}>{tag}</span>
                </div>
                <h3 className="font-bold text-lg text-[#0D0D0D] group-hover:text-[#C9A84C] transition-colors">{title}</h3>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="text-[#C9A84C] font-bold text-base">{price}</span>
                  <span className="text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 px-3 py-1 rounded-full">Solicitar →</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1A1208 100%)" }}>
            <div>
              <h3 className="text-white text-2xl font-bold mb-1">Não encontras o que precisas?</h3>
              <p className="text-white/40 text-sm">Fala connosco — criamos soluções à medida para o teu negócio.</p>
            </div>
            <Link href="/contacto" className="btn-primary shrink-0 text-base px-8 py-4 rounded-2xl">Falar Connosco →</Link>
          </div>
        </div>
      </section>

      {/* ── PORQUÊ MUIANGA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge bg-[#1D9E75]/10 text-[#1D9E75] mb-3 border border-[#1D9E75]/20">Porquê escolher-nos</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#0D0D0D] max-w-2xl mx-auto">
              Uma plataforma feita<br /><span className="text-[#C9A84C]">para o mundo lusófono</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyUs.map(({ Icon, bg, iconBg, iconColor, border, title, desc }) => (
              <div key={title} className={`rounded-2xl bg-gradient-to-br ${bg} border ${border} p-8`}>
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <h3 className="font-bold text-xl text-[#0D0D0D] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VAGAS CTA ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, #0A0A0F 0%, #0D0B08 100%)" }}>
            <div>
              <span className="badge bg-white/8 text-white/40 mb-3 border border-white/10">Para empresas & talentos</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Vagas de Emprego</h3>
              <p className="text-white/35 text-sm max-w-md leading-relaxed">Procuras talento ou a tua próxima oportunidade? A rede MUIANGA liga profissionais a empresas em MZ, PT e ZA.</p>
            </div>
            <Link href="/emprego" className="shrink-0 btn-primary text-base px-8 py-4 rounded-2xl">Ver Vagas em aberto →</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] mb-3 border border-[#C9A84C]/20">O que dizem os clientes</span>
            <h2 className="text-3xl sm:text-4xl text-[#0D0D0D]">Resultados reais,<br /><span className="text-[#C9A84C]">clientes reais</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ text, name, role }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#C9A84C]/20 transition-all">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F5EF]">
        <div className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #D4B255 40%, #A8893E 100%)" }}>
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
        </div>
      </section>
    </>
  );
}
