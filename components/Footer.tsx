import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0D0D0D]">
      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white font-bold text-xl sm:text-2xl">Pronto para começar?</p>
            <p className="text-white/40 text-sm mt-1">Solicita o teu serviço hoje — resposta em 24h.</p>
          </div>
          <Link href="/servicos"
            className="shrink-0 inline-flex items-center gap-2 bg-[#C9A84C] text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-[#B8943E] transition-all active:scale-95"
          >
            Ver Serviços e Preços →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-syne text-3xl font-bold text-[#C9A84C] block mb-1">MUIANGA</span>
            <span className="text-xs text-white/30 tracking-widest uppercase">Consultores</span>
            <p className="text-white/40 text-sm mt-4 leading-relaxed">
              A plataforma de consultoria e desenvolvimento para Moçambique e a lusofonia.
            </p>
            <div className="flex gap-2 mt-5">
              {["MZ","AO","BR","PT","CV","ST"].map(c => (
                <span key={c} className="bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-bold px-2.5 py-1 rounded-lg">{c}</span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">Plataforma</p>
            <ul className="space-y-3">
              {[["Início","/"],["Serviços","/servicos"],["Emprego","/emprego"],["Comunidade","/comunidade"]].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-white/50 text-sm hover:text-[#C9A84C] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">Empresa</p>
            <ul className="space-y-3">
              {[["Sobre Nós","/sobre"],["Contacto","/contacto"],["Termos de Uso","/termos"]].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-white/50 text-sm hover:text-[#C9A84C] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">Contacto</p>
            <ul className="space-y-3 text-sm text-white/50">
              <li>Maputo, Moçambique</li>
              <li><a href="mailto:minville@outlook.pt" className="hover:text-[#C9A84C] transition-colors">minville@outlook.pt</a></li>
              <li><a href="tel:+258876252006" className="hover:text-[#C9A84C] transition-colors">876 252 006</a></li>
              <li><a href="tel:+258846283051" className="hover:text-[#C9A84C] transition-colors">846 283 051</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/20 text-xs">&copy; {year} MUIANGA CONSULTORES — Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="text-white/20 text-xs hover:text-white/40 transition-colors">Termos de Uso</Link>
            <p className="text-white/15 text-xs">Feito em Maputo 🇲🇿</p>
          </div>
        </div>
      </div>
    </footer>
  );
}