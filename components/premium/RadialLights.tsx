"use client";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Slow-moving radial golden lights — adds depth & luxury behind dark sections.
 * Pure CSS gradients animated via Framer Motion transform (GPU).
 */
export default function RadialLights({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Ouro claro — canto superior esquerdo */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(232,199,102,0.18), transparent 70%)",
          willChange: "transform",
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, 60, -30, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Bronze — canto inferior direito */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[55vw] h-[55vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(168,124,46,0.18), transparent 70%)",
          willChange: "transform",
        }}
        animate={{ x: [0, -70, 40, 0], y: [0, -50, 30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Ouro marca — centro */}
      <motion.div
        className="absolute top-1/3 left-1/2 w-[40vw] h-[40vw] rounded-full -translate-x-1/2"
        style={{
          background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)",
          willChange: "transform",
        }}
        animate={{ x: ["-50%", "-40%", "-60%", "-50%"], y: [0, -40, 40, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Âmbar — direita superior */}
      <motion.div
        className="absolute -top-1/6 right-0 w-[35vw] h-[35vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)",
          willChange: "transform",
        }}
        animate={{ x: [0, -60, 30, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
