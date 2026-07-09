"use client";
import { useState } from "react";
import { Zap, Globe, BookOpen, Calendar, Compass, Rocket, type LucideIcon } from "lucide-react";

const benefits: { Icon: LucideIcon; iconBg: string; iconColor: string; title: string; desc: string }[] = [
  { Icon: Zap,      iconBg: "bg-amber-50",  iconColor: "text-amber-600",  title: "Acesso a Boladas",       desc: "Candidata-te a micro-trabalhos pagos publicados pela MUIANGA CARREIRAS e parceiros." },
  { Icon: Globe,    iconBg: "bg-blue-50",   iconColor: "text-blue-600",   title: "Rede PALOP & Lusofonia",    desc: "Conecta-te com profissionais em MZ, Angola, Cabo Verde, Brasil, Portugal e todos os PALOP." },
  { Icon: BookOpen, iconBg: "bg-purple-50", iconColor: "text-purple-600", title: "Conteúdo Exclusivo",        desc: "Artigos, guias e recursos formativos disponíveis apenas para membros da comunidade." },
  { Icon: Calendar, iconBg: "bg-green-50",  iconColor: "text-[#1D9E75]",  title: "Eventos & Webinars",        desc: "Acesso antecipado e gratuito a eventos, workshops e webinars promovidos pela empresa." },
  { Icon: Compass,  iconBg: "bg-orange-50", iconColor: "text-orange-600", title: "Mentoria em Grupo",         desc: "Sessões mensais de mentoria em grupo com a liderança da MUIANGA e convidados especiais." },
  { Icon: Rocket,   iconBg: "bg-sky-50",    iconColor: "text-sky-600",    title: "Oportunidades Prioritárias",desc: "Vagas e projectos são apresentados primeiro aos membros da comunidade." },
];

const areas = ["Gestão & Administração","Tecnologia & Informática","Educação & Formação","Saúde","Direito","Engenharia","Artes & Comunicação","Comércio & Vendas","Outra"];
const paises = ["Moçambique","Portugal","África do Sul","Brasil","Angola","Outro"];

export default function ComunidadePage() {
  const [form, setForm] = useState({ nome: "", email: "", tel: "", area: "", pais: "", motivacao: "" });
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/comunidade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSubmitted(true);
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-28 sm:pt-32 pb-16 bg-gradient-to-br from-[#0D0D0D] via-[#1A1208] to-[#0D1A12] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C] opacity-10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1D9E75] opacity-10 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-[#1D9E75]/20 border border-[#1D9E75]/30 rounded-full px-4 py-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
            <span className="text-[#1D9E75] text-xs font-semibold">Comunidade activa</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-5 max-w-3xl">
            Junta-te à comunidade <span className="text-[#C9A84C]">lusófona</span>
          </h1>
          <p className="text-white/40 text-base max-w-xl leading-relaxed mb-10">
            Uma rede de profissionais, empreendedores e talentos moçambicanos unidos pelo desejo de crescer, colaborar e impactar.
          </p>
          <div className="flex flex-wrap gap-3">
            {[{ code:"MZ", label:"Moçambique" },{ code:"AO", label:"Angola" },{ code:"BR", label:"Brasil" },{ code:"PT", label:"Portugal" },{ code:"+", label:"PALOP & Lusofonia" }].map(({ code, label }) => (
              <div key={code} className={`rounded-xl px-5 py-3 text-center border ${code === "+" ? "bg-[#C9A84C] border-[#C9A84C]" : "bg-white/5 border-white/10"}`}>
                <p className={`font-bold text-xl ${code === "+" ? "text-[#0D0D0D]" : "text-white"}`}>{code}</p>
                <p className={`text-xs ${code === "+" ? "text-[#0D0D0D]/60" : "text-white/30"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] mb-3 inline-flex">Benefícios</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D0D0D]">O que ganhas ao entrar</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map(({ Icon, iconBg, iconColor, title, desc }, i) => (
              <div key={title} className="service-card group">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <span className="text-3xl font-bold text-gray-100">0{i + 1}</span>
                </div>
                <h3 className="font-bold text-base text-[#0D0D0D] group-hover:text-[#C9A84C] transition-colors">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="badge bg-[#1D9E75]/10 text-[#1D9E75] mb-3 inline-flex">Registo gratuito</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D0D0D] mb-3">Entrar na comunidade</h2>
            <p className="text-gray-400 text-sm">Sem custos. Sem compromisso. Só crescimento.</p>
          </div>

          {submitted ? (
            <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-[#1D9E75]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket size={28} className="text-[#1D9E75]" />
              </div>
              <p className="text-2xl font-bold text-[#1D9E75] mb-2">Bem-vindo(a) à comunidade!</p>
              <p className="text-gray-500 text-sm">O teu registo foi recebido. Entraremos em contacto para activar o teu acesso.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="grid sm:grid-cols-2 gap-4">
                {[{ name:"nome",label:"Nome completo",placeholder:"O teu nome" },{ name:"email",label:"Email",placeholder:"email@exemplo.com" }].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <input type="text" required placeholder={placeholder} value={form[name as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Telefone / WhatsApp</label>
                <input type="text" placeholder="+258 84 000 0000" value={form.tel}
                  onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[{ name:"area",label:"Área profissional",options:areas },{ name:"pais",label:"País de residência",options:paises }].map(({ name, label, options }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <select value={form[name as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all text-gray-700">
                      <option value="">Seleccionar...</option>
                      {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Porque queres entrar na comunidade?</label>
                <textarea rows={3} placeholder="Apresenta-te brevemente..." value={form.motivacao}
                  onChange={(e) => setForm((f) => ({ ...f, motivacao: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300 resize-none" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-4 text-base rounded-xl">Registar Gratuitamente →</button>
              <p className="text-center text-gray-300 text-xs">Registo gratuito · Sem spam · Podes sair quando quiseres</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
