"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre Nós" },
  { href: "/emprego", label: "Emprego", highlight: true },
  { href: "/curriculum", label: "Currículo" },
  { href: "/documentos", label: "Documentos" },
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
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        dark
          ? "bg-transparent"
          : "bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] border-b border-white/40"
      }`}
      style={!dark ? { backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" } : undefined}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-500 ${scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"}`}>

        {/* Logo — encolhe no scroll */}
        <Link href="/" className="flex items-baseline gap-2 shrink-0 group">
          <span
            className="font-syne font-bold tracking-tight origin-left"
            style={{
              fontSize: scrolled ? "1.05rem" : "1.25rem",
              backgroundImage: "linear-gradient(135deg, #FE0000 0%, #D20001 55%, #4F0101 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            MUIANGA
          </span>
          <span className={`text-xs font-medium transition-colors ${dark ? "text-white/55" : "text-gray-400"}`}>
            Carreiras
          </span>
        </Link>

        {/* Desktop nav — com indicador animado */}
        <nav className="hidden lg:flex items-center gap-1 relative">
          {links.map(({ href, label, highlight }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? dark ? "text-white font-semibold" : "text-[#2A0001] font-semibold"
                    : highlight
                    ? "text-[#D20001] hover:bg-[#D20001]/10"
                    : dark
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-[#2A0001] hover:bg-gray-100"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{ background: "linear-gradient(135deg, rgba(254,0,0,0.16), rgba(79,1,1,0.10))" }}
                  />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA + user + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/conta" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors">
                <UserCircle2 size={16} className="text-[#D20001]" />
                <span className="text-sm font-semibold text-[#2A0001] max-w-[120px] truncate">{nomeUser}</span>
              </Link>
              <button onClick={signOut} title="Sair"
                className={`p-2 rounded-xl transition-colors ${dark ? "text-white/70 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/emprego"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, #FE0000 0%, #D20001 55%, #4F0101 100%)",
                color: "#FFFFFF",
                boxShadow: "0 6px 20px -6px rgba(210,0,1,0.5)",
              }}
            >
              Ver Vagas <ChevronRight size={14} />
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              dark ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Menu"
          >
            <span key={open ? "x" : "menu"} className="block">
              {open ? <X size={22} /> : <Menu size={22} />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
          <div
            key="drawer"
            className="lg:hidden absolute inset-x-0 top-full bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-2xl rounded-b-3xl overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-1">
              {links.map(({ href, label }, i) => (
                <div key={href}>
                  <Link href={href} onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-colors ${
                      pathname === href
                        ? "bg-[#D20001]/10 text-[#4F0101]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                    <ChevronRight size={14} className="text-gray-300" />
                  </Link>
                </div>
              ))}
              <div
                className="pt-4 mt-2 border-t border-gray-100 space-y-2"
              >
                {user ? (
                  <>
                    <Link href="/conta" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 bg-[#D20001]/10 rounded-2xl">
                      <UserCircle2 size={18} className="text-[#D20001]" />
                      <span className="text-sm font-semibold text-[#2A0001] truncate">{nomeUser}</span>
                    </Link>
                    <button onClick={() => { signOut(); setOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut size={15} /> Sair da conta
                    </button>
                  </>
                ) : (
                  <Link href="/emprego" onClick={() => setOpen(false)}
                    className="w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #FE0000 0%, #D20001 55%, #4F0101 100%)", color: "#FFFFFF" }}
                  >
                    Ver Vagas →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
    </header>
  );
}
