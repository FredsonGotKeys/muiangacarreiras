import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[120px] font-black text-[#D20001] leading-none mb-2" style={{ fontFamily: "var(--font-display)" }}>404</p>
        <h1 className="text-2xl font-bold text-[#2A0001] mb-3">Página não encontrada</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          A página que procuras não existe ou foi movida. Verifica o endereço ou volta ao início.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/" className="btn-primary">
            <Home size={15} /> Página inicial
          </Link>
          <Link href="/emprego" className="btn-ghost">
            <Search size={15} /> Ver vagas
          </Link>
        </div>
        <p className="text-xs text-gray-300 mt-12 font-medium tracking-widest uppercase">Muianga Carreiras</p>
      </div>
    </div>
  );
}
