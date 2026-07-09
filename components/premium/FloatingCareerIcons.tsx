"use client";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Laptop2, Briefcase, TrendingUp, Sparkles, Link2 } from "lucide-react";
import { useIsMobile } from "@/lib/use-is-mobile";

const ICONS = [
  { Icon: FileText,    color: "#E8C766", top: "8%",  left: "6%",  size: 22, dur: 7,  delay: 0 },
  { Icon: Laptop2,     color: "#C9A84C", top: "68%", left: "3%",  size: 26, dur: 8,  delay: 0.6 },
  { Icon: Briefcase,   color: "#D4AF37", top: "18%", left: "88%", size: 24, dur: 6.5,delay: 1.1 },
  { Icon: TrendingUp,  color: "#A87C2E", top: "78%", left: "90%", size: 22, dur: 7.5,delay: 0.3 },
  { Icon: Sparkles,    color: "#E8C766", top: "42%", left: "94%", size: 18, dur: 6,  delay: 1.6 },
  { Icon: Link2,       color: "#B8912F", top: "50%", left: "2%",  size: 20, dur: 8.5,delay: 0.9 },
];

/**
 * Ícones vectoriais flutuantes representando o domínio (CV, emprego, carreira).
 * Puramente decorativo (aria-hidden), leve — sem imagens externas.
 */
export default function FloatingCareerIcons() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  // Não monta em mobile — display:none via CSS ainda deixaria o Framer Motion a animar em segundo plano
  if (reduce || isMobile) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {ICONS.map(({ Icon, color, top, left, size, dur, delay }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top, left }}
          animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
          transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="flex items-center justify-center rounded-2xl backdrop-blur-md"
            style={{
              width: size + 22,
              height: size + 22,
              background: `${color}14`,
              border: `1px solid ${color}33`,
              boxShadow: `0 8px 24px -8px ${color}55`,
            }}
          >
            <Icon size={size} style={{ color }} strokeWidth={1.6} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
