"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const LETTERS = "MUIANGA".split("");

/**
 * Preloader premium — mostra apenas na primeira visita da sessão (sessionStorage).
 * Sequência: letras desenham-se → brilho dourado percorre → dissolve.
 * Nunca bloqueia mais de ~1.6s; motion-safe.
 */
export default function Preloader() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("mc_preloader_seen");
    if (seen) { setReady(true); return; }
    setVisible(true);
    sessionStorage.setItem("mc_preloader_seen", "1");
    const t = setTimeout(() => setVisible(false), reduce ? 300 : 1500);
    setReady(true);
    return () => clearTimeout(t);
  }, [reduce]);

  if (!ready) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #0A0E27 0%, #14103A 50%, #0A0E27 100%)" }}
        >
          <div className="relative flex" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            {LETTERS.map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                className="relative inline-block text-white font-extrabold"
                style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.02em" }}
              >
                {ch}
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(110deg, transparent 30%, #FF6B35 45%, #EC4899 55%, #06B6D4 65%, transparent 80%)",
                      backgroundSize: "260% 100%",
                    }}
                    animate={{ backgroundPositionX: ["140%", "-140%"] }}
                    transition={{ duration: 1.1, delay: 0.6 + i * 0.03, ease: "easeInOut" }}
                  >
                    {ch}
                  </motion.span>
                )}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
