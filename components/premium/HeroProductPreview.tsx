"use client";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Briefcase, BadgeCheck, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/lib/use-is-mobile";

/**
 * Preview do produto no hero — feed de vagas em glassmorphism.
 * Reforça a proposta de valor (plataforma de emprego) em vez de repetir a marca.
 * Usa exclusivamente a identidade dourada do projeto (#E8C766 → #C9A84C → #A87C2E)
 * e verde (#10B981) apenas como cor de status ("match/ao vivo").
 */
const VAGAS = [
  { cargo: "Contabilista Sénior", empresa: "Standard Bank", local: "Maputo", salario: "85.000 MT", match: 94, grad: "linear-gradient(135deg,#E8C766,#A87C2E)" },
  { cargo: "Gestor de Projectos", empresa: "Vodacom MZ", local: "Remoto", salario: "120.000 MT", match: 88, grad: "linear-gradient(135deg,#D4AF37,#8B6F1E)" },
  { cargo: "Técnico de TI", empresa: "Millennium bim", local: "Matola", salario: "60.000 MT", match: 81, grad: "linear-gradient(135deg,#C9A84C,#6E5518)" },
];

export default function HeroProductPreview() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const noLoop = reduce || isMobile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md"
    >
      {/* Glow dourado por trás do cartão — desligado em mobile (blur grande é caro) */}
      {!isMobile && (
        <div
          className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 60% 30%, rgba(232,199,102,0.30), rgba(168,124,46,0.12) 60%, transparent 75%)" }}
        />
      )}

      <motion.div
        animate={noLoop ? {} : { y: [0, -8, 0] }}
        transition={noLoop ? {} : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-3xl p-5"
        style={{
          // Fundo sólido semi-transparente em mobile em vez de backdrop-blur (muito mais leve)
          background: isMobile ? "rgba(20,17,10,0.92)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: isMobile ? undefined : "blur(20px)",
          WebkitBackdropFilter: isMobile ? undefined : "blur(20px)",
          boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header do cartão */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#E8C766,#A87C2E)" }}>
              <Briefcase className="w-4 h-4" style={{ color: "#1A1408" }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Vagas para ti</p>
              <p className="text-[10px] text-white/65 mt-0.5">Actualizadas hoje</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
            <span className="relative flex w-1.5 h-1.5">
              {!noLoop && <span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: "#10B981", opacity: 0.6 }} />}
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: "#10B981" }} />
            </span>
            Ao vivo
          </span>
        </div>

        {/* Lista de vagas */}
        <div className="space-y-2.5">
          {VAGAS.map((v, i) => (
            <motion.div
              key={v.cargo}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-extrabold" style={{ background: v.grad, color: "#1A1408" }}>
                {v.empresa.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white truncate">{v.cargo}</p>
                <div className="flex items-center gap-2 text-[11px] text-white/60">
                  <span className="truncate">{v.empresa}</span>
                  <span className="flex items-center gap-0.5 shrink-0"><MapPin className="w-2.5 h-2.5" />{v.local}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold" style={{ color: "#E8C766" }}>{v.salario}</p>
                <p className="flex items-center gap-0.5 justify-end text-[10px] font-semibold" style={{ color: "#10B981" }}>
                  <BadgeCheck className="w-2.5 h-2.5" />{v.match}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rodapé — mini insight */}
        <div className="mt-4 pt-3 flex items-center gap-2 border-t border-white/10">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#E8C766" }} />
          <p className="text-[11px] text-white/70">
            <span className="font-bold text-white">+40 vagas novas</span> esta semana no teu perfil
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
