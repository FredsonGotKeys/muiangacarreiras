import Link from "next/link";
import { Shield, Award, Zap, Heart, type LucideIcon } from "lucide-react";
import FounderPhoto from "@/components/FounderPhoto";

const values: { Icon: LucideIcon; iconBg: string; iconColor: string; title: string; desc: string }[] = [
  { Icon: Shield, iconBg: "bg-blue-50",   iconColor: "text-blue-600",   title: "Integridade", desc: "Cada entrega reflecte o nosso compromisso com a honestidade, a ética e a transparência total." },
  { Icon: Award,  iconBg: "bg-amber-50",  iconColor: "text-amber-600",  title: "Excelência",  desc: "Padrões elevados em tudo o que fazemos, porque os nossos clientes merecem o melhor de Moçambique." },
  { Icon: Zap,    iconBg: "bg-green-50",  iconColor: "text-[#D20001]",  title: "Impacto",     desc: "Medimos o sucesso pelo impacto real que geramos nas pessoas, nas empresas e nas comunidades." },
  { Icon: Heart,  iconBg: "bg-red-50",    iconColor: "text-red-500",    title: "Identidade",  desc: "Orgulho na raiz moçambicana, visão lusófona, e a convicção de que África tem muito a oferecer ao mundo." },
];

const stats = [
  { value: "200+", label: "Projectos entregues" },
  { value: "10+",  label: "Anos de experiência" },
  { value: "6",    label: "Países de actuação" },
  { value: "98%",  label: "Clientes satisfeitos" },
];

export default function SobrePage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="pt-28 sm:pt-32 pb-12 bg-[#4F0101] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D20001] opacity-10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D20001] opacity-10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/20 text-[#D20001] mb-6">Quem somos</span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
            <span className="text-[#D20001]">MUIANGA</span><br />
            <span className="text-white/50 font-light text-[0.6em] tracking-[0.2em] uppercase">Consultores</span>
          </h1>
          <p className="text-white/40 text-base max-w-xl leading-relaxed mb-10">
            Nascemos em Maputo com uma missão clara: transformar o potencial moçambicano em resultados reais para empresas, profissionais e comunidades.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {stats.map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-3xl font-bold text-[#D20001]">{value}</p>
                <p className="text-white/35 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="w-8 h-1 bg-[#D20001] rounded-full mb-5" />
            <span className="badge bg-[#D20001]/10 text-[#D20001] mb-3 inline-flex">Missão</span>
            <h2 className="text-2xl font-bold text-[#2A0001] mb-4 leading-snug">Impulsionar o crescimento sustentável</h2>
            <p className="text-gray-400 text-sm leading-relaxed">A MUIANGA CARREIRAS existe para impulsionar o crescimento sustentável de empresas, profissionais e comunidades em Moçambique e na África lusófona, através de consultoria estratégica, formação de excelência e conexão de talentos com oportunidades reais.</p>
          </div>
          <div className="bg-[#4F0101] rounded-2xl p-8">
            <div className="w-8 h-1 bg-[#D20001] rounded-full mb-5" />
            <span className="badge bg-[#D20001]/20 text-[#D20001] mb-3 inline-flex">Visão</span>
            <h2 className="text-2xl font-bold text-white mb-4 leading-snug">Referência da África lusófona</h2>
            <p className="text-white/40 text-sm leading-relaxed">Ser reconhecida como a principal empresa de consultoria multifuncional da África lusófona, servindo Moçambique, Portugal e África do Sul com soluções inovadoras e impacto mensurável até 2030.</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="badge bg-[#D20001]/10 text-[#D20001] mb-3 inline-flex">Valores</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2A0001]">O que nos define</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ Icon, iconBg, iconColor, title, desc }, i) => (
              <div key={title} className="service-card group">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <span className="text-3xl font-bold text-gray-100 group-hover:text-[#D20001]/20 transition-colors">0{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-[#2A0001] group-hover:text-[#D20001] transition-colors">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="badge bg-[#D20001]/10 text-[#D20001] mb-3 inline-flex">Liderança</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2A0001] mb-12">Quem nos lidera</h2>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <FounderPhoto />
            <div className="pt-4 lg:pt-8">
              <span className="badge bg-[#D20001]/10 text-[#D20001] mb-3 inline-flex">Fundador & CEO</span>
              <h3 className="text-3xl sm:text-4xl font-bold text-[#2A0001] mb-1 leading-tight">Fredson Bernardo</h3>
              <h3 className="text-3xl sm:text-4xl font-bold text-[#D20001] mb-6">Muianga</h3>
              <p className="text-gray-500 text-base leading-relaxed mb-4">A MUIANGA CARREIRAS foi fundada e é liderada por alguém com mais de uma década de experiência entre Moçambique, Portugal e África do Sul, construindo pontes entre mercados, culturas e oportunidades lusófonas.</p>
              <p className="text-gray-500 text-base leading-relaxed mb-4">À frente da empresa, a visão é clara: Moçambique tem talento de sobra. O que falta são as pontes certas. A MUIANGA CARREIRAS é exactamente isso: uma plataforma onde o talento moçambicano encontra estratégia, formação e oportunidade.</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">A liderança da empresa está também envolvida na <span className="text-[#D20001] font-semibold">ADIEP</span> e na <span className="text-[#D20001] font-semibold">Fundação Muianga</span>, iniciativas que reforçam o compromisso com o impacto social e cultural em Moçambique.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Professor","Palestrante","Empresário","Pres. ADIEP","Lusofonia"].map((tag) => (
                  <span key={tag} className="badge bg-gray-100 text-gray-600 hover:bg-[#D20001] hover:text-white transition-all cursor-default">{tag}</span>
                ))}
              </div>
              <Link href="/contacto" className="btn-primary">Contactar a MUIANGA →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#4F0101] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="badge bg-[#D20001]/20 text-[#D20001] mb-6 inline-flex">Onde actuamos</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">Presença lusófona</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-3xl mx-auto">
            {[{ code:"MZ", name:"Moçambique", desc:"Sede & mercado principal" },{ code:"AO", name:"Angola", desc:"PALOP & parcerias" },{ code:"BR", name:"Brasil", desc:"Lusofonia das Américas" },{ code:"PT", name:"Portugal", desc:"Rede lusófona europeia" }].map(({ code, name, desc }) => (
              <div key={code} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-[#D20001] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-[#2A0001]">{code}</span>
                </div>
                <p className="font-bold text-white mb-1">{name}</p>
                <p className="text-white/30 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
