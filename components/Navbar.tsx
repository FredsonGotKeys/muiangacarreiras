"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, LogOut, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre Nós" },
  { href: "/servicos", label: "Serviços" },
  { href: "/emprego", label: "Emprego", highlight: true },
  { href: "/curriculum", label: "Currículo" },
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
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
          <motion.span
            animate={{ scale: scrolled ? 0.88 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-syne font-bold tracking-tight origin-left"
            style={{
              fontSize: scrolled ? "1.05rem" : "1.25rem",
              backgroundImage: "linear-gradient(135deg, #E8C766 0%, #C9A84C 55%, #A87C2E 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            MUIANGA
          </motion.span>
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
                    ? dark ? "text-white font-semibold" : "text-[#0D0D0D] font-semibold"
                    : highlight
                    ? "text-[#C9A84C] hover:bg-[#C9A84C]/10"
                    : dark
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-[#0D0D0D] hover:bg-gray-100"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{ background: "linear-gradient(135deg, rgba(232,199,102,0.16), rgba(168,124,46,0.10))" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, #E8C766 0%, #C9A84C 55%, #A87C2E 100%)",
                color: "#1A1408",
                boxShadow: "0 6px 20px -6px rgba(201,168,76,0.5)",
              }}
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden absolute inset-x-0 top-full bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-2xl rounded-b-3xl overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-1">
              {links.map(({ href, label }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <Link href={href} onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-colors ${
                      pathname === href
                        ? "bg-[#C9A84C]/10 text-[#A87C2E]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                    <ChevronRight size={14} className="text-gray-300" />
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="pt-4 mt-2 border-t border-gray-100 space-y-2"
              >
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
                    className="w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #E8C766 0%, #C9A84C 55%, #A87C2E 100%)", color: "#1A1408" }}
                  >
                    Solicitar Serviço →
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
