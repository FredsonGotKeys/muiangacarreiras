import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C] opacity-10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="relative text-center max-w-md">
        <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-4">Erro 404</p>
        <h1 className="text-7xl sm:text-9xl font-bold text-white mb-2">404</h1>
        <p className="text-white/40 text-lg mb-8">Esta página não existe ou foi movida.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#B8943E] text-white font-bold px-6 py-3.5 rounded-2xl transition-all text-sm"
          >
            Voltar ao início
          </Link>
          <Link
            href="/emprego"
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl border border-white/10 transition-all text-sm"
          >
            Ver vagas de emprego
          </Link>
        </div>
        <p className="text-white/20 text-xs mt-10">MUIANGA CONSULTORES · Maputo, Moçambique</p>
      </div>
    </div>
  );
}
