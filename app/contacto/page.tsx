"use client";
import { useState } from "react";
import { MapPin, Mail, Phone, MessageSquare, ClipboardList, Handshake, Briefcase, CheckCircle2, type LucideIcon } from "lucide-react";

const contacts = [
  { Icon: MapPin, label: "Morada",    value: "Maputo, Moçambique",  href: undefined },
  { Icon: Mail,   label: "Email",     value: "minville@outlook.pt", href: "mailto:minville@outlook.pt" },
  { Icon: Phone,  label: "Telefone",  value: "876 252 006",         href: "tel:+258876252006" },
  { Icon: Phone,  label: "Telefone",  value: "846 283 051",         href: "tel:+258846283051" },
];

export default function ContactoPage() {
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/contacto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitted(true);
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-28 sm:pt-32 pb-12 bg-[#4F0101] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D20001] opacity-10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/20 text-[#D20001] mb-5">
            Contacto
          </span>
          <h1 className="font-syne text-4xl sm:text-5xl font-bold text-white mb-4">
            Vamos <span className="text-[#D20001]">conversar</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-lg leading-relaxed">
            Seja para solicitar uma consultoria, propor uma parceria ou simplesmente conhecer melhor o nosso trabalho, estamos disponíveis em Moçambique, Angola, Brasil, Portugal e PALOP.
          </p>

          {/* Contact chips */}
          <div className="flex flex-wrap gap-3 mt-8">
            {contacts.map(({ Icon, label, value, href }) => (
              <div key={label} className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
                <Icon size={14} className="text-[#D20001]" />
                {href ? (
                  <a href={href} className="text-white/70 text-xs hover:text-[#D20001] transition-colors">{value}</a>
                ) : (
                  <span className="text-white/70 text-xs">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left: info */}
          <div className="lg:col-span-2">
            <h2 className="font-syne text-2xl font-bold text-[#2A0001] mb-6">Como podemos ajudar?</h2>

            <div className="space-y-4 mb-10">
              {([
                { Icon: ClipboardList, iconBg: "bg-amber-50",  iconColor: "text-amber-600",  title: "Solicitar serviço",           desc: "Consultoria, formação, monografias, informática e mais 17 serviços." },
                { Icon: Handshake,    iconBg: "bg-blue-50",   iconColor: "text-blue-600",   title: "Propor parceria",             desc: "Empresas e instituições que querem colaborar com a rede MUIANGA." },
                { Icon: Briefcase,    iconBg: "bg-violet-50", iconColor: "text-violet-600", title: "Oportunidades de emprego",    desc: "Candidaturas espontâneas e propostas para a equipa." },
              ] as { Icon: LucideIcon; iconBg: string; iconColor: string; title: string; desc: string }[]).map(({ Icon, iconBg, iconColor, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#D20001]/30 transition-colors">
                  <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#2A0001] mb-0.5">{title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact details */}
            <div className="bg-[#4F0101] rounded-2xl p-6">
              <p className="font-syne font-bold text-white mb-4">Detalhes de contacto</p>
              <div className="space-y-4">
                {contacts.map(({ Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#D20001]/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-[#D20001]" />
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">{label}</p>
                      {href ? (
                        <a href={href} className="text-white/70 text-sm hover:text-[#D20001] transition-colors">{value}</a>
                      ) : (
                        <p className="text-white/70 text-sm">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-white/30 text-xs mb-3">Países de actuação</p>
                <div className="flex flex-wrap gap-2">
                  {["MZ", "AO", "BR", "PT", "CV", "ST"].map((c) => (
                    <span key={c} className="badge bg-[#D20001]/20 text-[#D20001]">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#D20001]/10 rounded-xl flex items-center justify-center">
                  <MessageSquare size={18} className="text-[#D20001]" />
                </div>
                <div>
                  <p className="font-syne font-bold text-[#2A0001]">Enviar mensagem</p>
                  <p className="text-gray-400 text-xs">Resposta garantida em 24h</p>
                </div>
              </div>

              {submitted ? (
                <div className="bg-[#D20001]/10 border border-[#D20001]/30 rounded-2xl p-8 text-center">
                  <div className="w-12 h-12 bg-[#D20001]/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} className="text-[#D20001]" />
                  </div>
                  <p className="font-syne text-2xl font-bold text-[#D20001] mb-2">Mensagem enviada!</p>
                  <p className="text-gray-500 text-sm">Obrigado pelo contacto. Responderemos nas próximas 24 horas.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-primary mt-6">
                    Nova mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { name: "nome", label: "Nome", placeholder: "O seu nome" },
                      { name: "email", label: "Email", placeholder: "email@exemplo.com" },
                    ].map(({ name, label, placeholder }) => (
                      <div key={name}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                        <input
                          type="text"
                          required
                          placeholder={placeholder}
                          value={form[name as keyof typeof form]}
                          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#D20001] focus:ring-2 focus:ring-[#D20001]/10 transition-all placeholder:text-gray-300"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assunto</label>
                    <select
                      value={form.assunto}
                      onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#D20001] focus:ring-2 focus:ring-[#D20001]/10 transition-all text-gray-700"
                    >
                      <option value="">Seleccionar assunto...</option>
                      {["Solicitar serviço", "Propor parceria", "Candidatura espontânea", "Informação geral", "Outro"].map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mensagem</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Escreva a sua mensagem..."
                      value={form.mensagem}
                      onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#D20001] focus:ring-2 focus:ring-[#D20001]/10 transition-all placeholder:text-gray-300 resize-none"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center py-4 text-base rounded-xl">
                    Enviar Mensagem →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
