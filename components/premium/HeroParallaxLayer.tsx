"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * Wraps hero content and applies a subtle mouse-parallax tilt/translate.
 * GPU-only (transform), springs for smoothness, disabled on touch & reduced-motion.
 */
export default function HeroParallaxLayer({
  children,
  strength = 14,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const x = useSpring(mvX, { stiffness: 60, damping: 20, mass: 0.6 });
  const y = useSpring(mvY, { stiffness: 60, damping: 20, mass: 0.6 });
  const translateX = useTransform(x, [-1, 1], [-strength, strength]);
  const translateY = useTransform(y, [-1, 1], [-strength * 0.6, strength * 0.6]);

  function onMouseMove(e: React.MouseEvent) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mvX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    mvY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function onMouseLeave() {
    mvX.set(0);
    mvY.set(0);
  }

  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className="relative w-full h-full">
      <motion.div style={reduce ? undefined : { x: translateX, y: translateY }} className="relative w-full h-full">
        {children}
      </motion.div>
    </div>
  );
}
