"use client";
import { useState } from "react";
import {
  FileText, BarChart2, TrendingUp,
  Users, Mic, Building2,
  Laptop, Monitor, RefreshCw,
  FileUser, Compass, MessageSquare,
  GraduationCap, BookOpen, ClipboardList,
  Smartphone, ShoppingCart,
  Palette, Megaphone,
  Globe, Handshake,
  type LucideIcon,
} from "lucide-react";

type Service = {
  category: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  price: string;
  tags: string[];
  badge?: { label: string; color: string };
};

const services: Service[] = [
  { category: "Consultoria Estratégica",    Icon: FileText,      iconBg: "bg-amber-50",   iconColor: "text-amber-600",  title: "Plano de Negócio",           desc: "Elaboração de plano de negócio completo, com análise de mercado, projecções financeiras e estratégia de crescimento.",   price: "A partir de 15.000 MT", tags: ["Presencial","Remoto","PME"],         badge: { label: "Popular",  color: "bg-amber-100 text-amber-800" } },
  { category: "Consultoria Estratégica",    Icon: BarChart2,     iconBg: "bg-amber-50",   iconColor: "text-amber-600",  title: "Análise de Mercado",          desc: "Estudo aprofundado do mercado moçambicano e regional para decisões estratégicas fundamentadas.",                          price: "A partir de 10.000 MT", tags: ["Remoto","Relatório"] },
  { category: "Consultoria Estratégica",    Icon: TrendingUp,    iconBg: "bg-amber-50",   iconColor: "text-amber-600",  title: "Captação de Investimento",    desc: "Estruturação de pitch deck, valuation e preparação para apresentação a investidores e parceiros.",                         price: "Sob consulta",          tags: ["Presencial","Startups"],            badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" } },
  { category: "Formação & Palestras",       Icon: Users,         iconBg: "bg-purple-50",  iconColor: "text-purple-600", title: "Workshop Empresarial",        desc: "Formação prática para equipas de gestão, com metodologias actuais e casos reais do mercado africano.",                    price: "A partir de 8.000 MT",  tags: ["Presencial","Grupo"] },
  { category: "Formação & Palestras",       Icon: Mic,           iconBg: "bg-purple-50",  iconColor: "text-purple-600", title: "Palestra Motivacional",       desc: "Palestras de impacto para empresas, universidades e eventos corporativos. Temas: liderança, empreendedorismo, lusofonia.", price: "Sob consulta",          tags: ["Presencial","Online"],             badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" } },
  { category: "Formação & Palestras",       Icon: Building2,     iconBg: "bg-purple-50",  iconColor: "text-purple-600", title: "Formação Corporativa",        desc: "Programa de formação à medida para empresas que pretendem desenvolver as competências internas das suas equipas.",        price: "Sob consulta",          tags: ["Presencial","Personalizado"] },
  { category: "Aulas de Informática",       Icon: Laptop,        iconBg: "bg-blue-50",    iconColor: "text-blue-600",   title: "Informática para Crianças",   desc: "Introdução à tecnologia e programação para crianças dos 6 aos 14 anos. Metodologia lúdica e progressiva.",               price: "2.500 MT / mês",        tags: ["Presencial","Crianças","Turma"],   badge: { label: "Novo",     color: "bg-green-100 text-green-800" } },
  { category: "Aulas de Informática",       Icon: Monitor,       iconBg: "bg-blue-50",    iconColor: "text-blue-600",   title: "Informática Básica — Adultos",desc: "Office, internet, email e ferramentas digitais essenciais para o mercado de trabalho actual.",                             price: "3.000 MT / mês",        tags: ["Presencial","Adultos"] },
  { category: "Aulas de Informática",       Icon: RefreshCw,     iconBg: "bg-blue-50",    iconColor: "text-blue-600",   title: "Reciclagem Tecnológica",      desc: "Actualização digital para profissionais e empresas: ferramentas cloud, produtividade e segurança digital.",               price: "4.000 MT / mês",        tags: ["Presencial","Remoto","Profissional"] },
  { category: "Desenvolvimento Profissional",Icon: FileUser,     iconBg: "bg-sky-50",     iconColor: "text-sky-600",    title: "CV & Candidaturas",           desc: "Revisão e criação de CV profissional, carta de motivação e optimização de perfil LinkedIn.",                              price: "1.500 MT",              tags: ["Remoto","Individual"],             badge: { label: "Rápido",   color: "bg-blue-100 text-blue-800" } },
  { category: "Desenvolvimento Profissional",Icon: Compass,      iconBg: "bg-sky-50",     iconColor: "text-sky-600",    title: "Mentoria Individual",         desc: "Sessões de mentoria 1:1 para definição de carreira, liderança e crescimento profissional.",                               price: "3.000 MT / sessão",     tags: ["Presencial","Online","Individual"], badge: { label: "Popular",  color: "bg-amber-100 text-amber-800" } },
  { category: "Desenvolvimento Profissional",Icon: MessageSquare,iconBg: "bg-sky-50",     iconColor: "text-sky-600",    title: "Preparação para Entrevistas", desc: "Simulações de entrevista, feedback estruturado e estratégias para comunicar valor em processos selectivos.",               price: "2.000 MT",              tags: ["Online","Individual"] },
  { category: "Monografias & Académico",    Icon: GraduationCap, iconBg: "bg-orange-50",  iconColor: "text-orange-600", title: "Apoio a Monografias",         desc: "Orientação metodológica, revisão estrutural e apoio na elaboração de monografias de licenciatura.",                       price: "A partir de 5.000 MT",  tags: ["Remoto","Licenciatura"],           badge: { label: "Popular",  color: "bg-amber-100 text-amber-800" } },
  { category: "Monografias & Académico",    Icon: BookOpen,      iconBg: "bg-orange-50",  iconColor: "text-orange-600", title: "Dissertações de Mestrado",    desc: "Acompanhamento completo: proposta, revisão de literatura, metodologia e preparação para defesa.",                         price: "A partir de 12.000 MT", tags: ["Remoto","Mestrado"] },
  { category: "Monografias & Académico",    Icon: ClipboardList, iconBg: "bg-orange-50",  iconColor: "text-orange-600", title: "Relatórios Técnicos",         desc: "Elaboração e revisão de relatórios técnicos e científicos para empresas e instituições.",                                  price: "Sob consulta",          tags: ["Remoto","Empresarial"] },
  { category: "Plataformas Digitais",       Icon: Smartphone,    iconBg: "bg-teal-50",    iconColor: "text-teal-600",   title: "Concepção de App / PWA",      desc: "Consultoria e desenvolvimento de aplicações web e móveis para negócios moçambicanos.",                                    price: "Sob consulta",          tags: ["Remoto","Tech","Startups"],        badge: { label: "Novo",     color: "bg-green-100 text-green-800" } },
  { category: "Plataformas Digitais",       Icon: ShoppingCart,  iconBg: "bg-teal-50",    iconColor: "text-teal-600",   title: "E-commerce",                  desc: "Criação de lojas online com integração de pagamentos locais (M-Pesa, e-Mola).",                                          price: "Sob consulta",          tags: ["Remoto","M-Pesa","PME"] },
  { category: "Comunicação & Marca",        Icon: Palette,       iconBg: "bg-pink-50",    iconColor: "text-pink-600",   title: "Branding Completo",           desc: "Identidade visual, logotipo, paleta de cores, tipografia e manual de marca para empresas.",                               price: "A partir de 8.000 MT",  tags: ["Remoto","Design"],                 badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" } },
  { category: "Comunicação & Marca",        Icon: Megaphone,     iconBg: "bg-pink-50",    iconColor: "text-pink-600",   title: "Estratégia de Conteúdo",      desc: "Plano editorial para redes sociais, blog e email marketing — adaptado ao mercado moçambicano.",                          price: "A partir de 5.000 MT",  tags: ["Remoto","Social Media"] },
  { category: "Networking Lusófono",        Icon: Globe,         iconBg: "bg-indigo-50",  iconColor: "text-indigo-600", title: "Acesso à Rede MZ·PT·ZA",      desc: "Integração na rede de parceiros e empresas nos três países. Introductions, eventos e oportunidades.",                    price: "Sob consulta",          tags: ["MZ","PT","ZA"] },
  { category: "Networking Lusófono",        Icon: Handshake,     iconBg: "bg-indigo-50",  iconColor: "text-indigo-600", title: "Parcerias Internacionais",    desc: "Identificação e facilitação de parcerias entre empresas moçambicanas e parceiros internacionais lusófonos.",              price: "Sob consulta",          tags: ["Internacional","B2B"] },
];

const categories = Array.from(new Set(services.map((s) => s.category)));

export default function ServicosPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [form, setForm] = useState({ nome: "", contacto: "", servico: "", orcamento: "", descricao: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const filtered = activeCategory === "Todos" ? services : services.filter((s) => s.category === activeCategory);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/service-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSubmitted(true);
    setSelected(null);
  }

  function solicitar(title: string) {
    setSelected(title);
    setForm((f) => ({ ...f, servico: title }));
    setTimeout(() => document.getElementById("form-pedido")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-28 sm:pt-32 pb-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A84C]/10 text-[#C9A84C] mb-4">Marketplace de Serviços</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#0D0D0D] mb-3">O que podes <span className="text-[#C9A84C]">solicitar</span></h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">21 serviços disponíveis — do plano de negócio à palestra motivacional. Solicita e recebe em dias.</p>
          <div className="flex gap-6 mt-8">
            <div><p className="text-2xl font-bold text-[#C9A84C]">21+</p><p className="text-xs text-gray-400 mt-0.5">Serviços</p></div>
            <div><p className="text-2xl font-bold text-[#C9A84C]">24h</p><p className="text-xs text-gray-400 mt-0.5">Resposta garantida</p></div>
            <div><p className="text-2xl font-bold text-[#C9A84C]">3</p><p className="text-xs text-gray-400 mt-0.5">Países</p></div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 sm:top-20 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {["Todos", ...categories].map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold whitespace-nowrap px-4 py-2 rounded-xl transition-all duration-200 ${activeCategory === cat ? "bg-[#C9A84C] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(({ Icon, iconBg, iconColor, title, desc, price, tags, badge, category }) => (
            <div key={title} className="service-card group">
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className={iconColor} />
                </div>
                {badge
                  ? <span className={`badge ${badge.color}`}>{badge.label}</span>
                  : <span className="badge bg-gray-100 text-gray-500 text-[10px]">{category.split(" ")[0]}</span>
                }
              </div>
              <h3 className="font-bold text-base text-[#0D0D0D] group-hover:text-[#C9A84C] transition-colors leading-snug">{title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1">{desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => <span key={tag} className="badge bg-gray-100 text-gray-500">{tag}</span>)}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <span className="text-[#C9A84C] font-bold text-sm">{price}</span>
                <button onClick={() => solicitar(title)} className="text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 hover:bg-[#1D9E75] hover:text-white px-3 py-1.5 rounded-full transition-all">
                  Solicitar →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-[#0D0D0D] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-white font-bold text-lg sm:text-xl mb-1">Não encontras o que precisas?</p>
            <p className="text-white/40 text-sm">Criamos soluções à medida para o teu negócio.</p>
          </div>
          <button onClick={() => document.getElementById("form-pedido")?.scrollIntoView({ behavior: "smooth" })} className="shrink-0 btn-primary">
            Falar Connosco →
          </button>
        </div>
      </section>

      <section id="form-pedido" className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] mb-4 inline-flex">Pedido de Serviço</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0D0D0D] mb-8">
            Solicitar{" "}{selected && <span className="text-[#C9A84C]">{selected}</span>}
          </h2>

          {submitted ? (
            <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-2xl p-8 text-center">
              <p className="text-2xl font-bold text-[#1D9E75] mb-2">Pedido recebido!</p>
              <p className="text-gray-500 text-sm">Entraremos em contacto nas próximas 24 horas.</p>
              <button onClick={() => setSubmitted(false)} className="btn-primary mt-6">Novo Pedido</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              {[
                { name: "nome", label: "Nome completo", type: "text", placeholder: "O seu nome" },
                { name: "contacto", label: "Contacto (telefone ou email)", type: "text", placeholder: "+258 84 000 0000 ou email@exemplo.com" },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input type={type} required placeholder={placeholder} value={form[name as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Serviço pretendido</label>
                <select required value={form.servico} onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all text-gray-700">
                  <option value="">Seleccionar serviço...</option>
                  {services.map((s) => <option key={s.title} value={s.title}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Orçamento aproximado (MT)</label>
                <input type="text" placeholder="ex: 5.000 MT" value={form.orcamento}
                  onChange={(e) => setForm((f) => ({ ...f, orcamento: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descrição / contexto</label>
                <textarea rows={4} required placeholder="Descreva brevemente o que precisa..." value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300 resize-none" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-4 text-base rounded-xl">Enviar Pedido →</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
