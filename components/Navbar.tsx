"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, Zap, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre Nós" },
  { href: "/servicos", label: "Serviços" },
  { href: "/emprego", label: "Boladas / Emprego", highlight: true },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const isHome = pathname === "/";
  const nomeUser: string = (user?.user_metadata?.nome as string | undefined) || user?.email?.split("@")[0] || "";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const dark = isHome && !scrolled;

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      dark ? "bg-transparent" : "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-syne text-xl font-bold text-[#C9A84C] tracking-tight">MUIANGA</span>
          <span className={`text-xs font-medium transition-colors ${dark ? "text-white/40" : "text-gray-400"}`}>
            Consultores
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map(({ href, label, highlight }) => (
            <Link key={href} href={href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === href || (pathname === "/emprego" && href === "/emprego")
                  ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                  : highlight
                  ? dark
                    ? "text-[#C9A84C] hover:bg-[#C9A84C]/10"
                    : "text-[#C9A84C] hover:bg-[#C9A84C]/10"
                  : dark
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-[#0D0D0D] hover:bg-gray-100"
              }`}
            >
              {highlight
                ? <span className="inline-flex items-center gap-1.5"><Zap size={12} className="fill-current" />{label}</span>
                : label}
            </Link>
          ))}
        </nav>

        {/* CTA + user + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <UserCircle2 size={16} className="text-[#C9A84C]" />
                <span className="text-sm font-semibold text-[#0D0D0D] max-w-[120px] truncate">{nomeUser}</span>
              </div>
              <button onClick={signOut} title="Sair"
                className={`p-2 rounded-xl transition-colors ${dark ? "text-white/70 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/servicos"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#C9A84C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#B8943E] transition-all active:scale-95 shadow-sm"
            >
              Solicitar Serviço <ChevronRight size={14} />
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              dark ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden absolute inset-x-0 top-full bg-white border-t border-gray-100 shadow-2xl rounded-b-3xl overflow-hidden">
          <div className="px-4 py-6 flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#C9A84C]/10 rounded-2xl">
                    <UserCircle2 size={18} className="text-[#C9A84C]" />
                    <span className="text-sm font-semibold text-[#0D0D0D] truncate">{nomeUser}</span>
                  </div>
                  <button onClick={() => { signOut(); setOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={15} /> Sair da conta
                  </button>
                </>
              ) : (
                <Link href="/servicos" onClick={() => setOpen(false)}
                  className="w-full btn-primary justify-center text-base py-4 rounded-2xl"
                >
                  Solicitar Serviço →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
