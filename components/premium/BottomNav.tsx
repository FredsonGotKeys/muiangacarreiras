"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Sparkles, FileText, UserCircle2 } from "lucide-react";

/**
 * Bottom Navigation mobile — simples, leve, identidade dourada.
 * Usa apenas rotas já existentes na app. Visível só em mobile (<lg).
 */
const ITEMS = [
  { href: "/",           label: "Início",     Icon: Home },
  { href: "/emprego",    label: "Empregos",   Icon: Briefcase },
  { href: "/curriculum", label: "Criar",      Icon: Sparkles, central: true },
  { href: "/documentos", label: "Documentos", Icon: FileText },
  { href: "/conta",      label: "Conta",      Icon: UserCircle2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div
        className="mx-3 mb-3 rounded-2xl flex items-center justify-around px-2 py-2"
        style={{
          background: "rgba(79,1,1,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(210,0,1,0.15)",
          boxShadow: "0 -6px 20px -6px rgba(0,0,0,0.4)",
        }}
      >
        {ITEMS.map(({ href, label, Icon, central }) => {
          const active = pathname === href;

          if (central) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="relative -mt-5 flex flex-col items-center active:scale-90 transition-transform"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #FE0000 0%, #4F0101 100%)",
                    boxShadow: "0 6px 16px -4px rgba(210,0,1,0.55)",
                  }}
                >
                  <Icon size={22} style={{ color: "#FFFFFF" }} strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-semibold mt-1" style={{ color: "#D20001" }}>
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                style={{ color: active ? "#D20001" : "rgba(255,255,255,0.45)" }}
              />
              <span
                className="text-[9px] font-semibold"
                style={{ color: active ? "#D20001" : "rgba(255,255,255,0.35)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
