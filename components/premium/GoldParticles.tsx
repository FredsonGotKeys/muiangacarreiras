"use client";
import { useEffect, useRef } from "react";

/**
 * Subtle golden particles drifting on a canvas.
 * GPU-friendly: single canvas, requestAnimationFrame, no DOM nodes per particle.
 * Density auto-tunes to viewport size; respects prefers-reduced-motion.
 */
const PALETTE = [
  "232,199,102",  // ouro claro  #E8C766
  "212,175,55",   // âmbar       #D4AF37
  "201,168,76",   // ouro marca  #C9A84C
  "184,145,47",   // ouro médio
  "168,124,46",   // bronze      #A87C2E
];

export default function GoldParticles({
  density = 0.00006,
  maxOpacity = 0.35,
  className = "",
  lightweight = false,
}: {
  density?: number;
  maxOpacity?: number;
  className?: string;
  /** Desliga shadowBlur (redesenho caro por frame) e reduz DPR — usar em mobile */
  lightweight?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, lightweight ? 1 : 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number; o: number; phase: number; c: number };
    let particles: P[] = [];
    let raf = 0;
    let running = true;

    function resize() {
      const parent = canvas!.parentElement;
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.scale(dpr, dpr);

      const count = Math.max(18, Math.min(80, Math.floor(w * h * density)));
      particles = Array.from({ length: count }, () => spawn(w, h));
    }

    function spawn(w: number, h: number): P {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -Math.random() * 0.18 - 0.04,
        r: Math.random() * 1.4 + 0.5,
        o: Math.random() * (maxOpacity - 0.1) + 0.1,
        phase: Math.random() * Math.PI * 2,
        c: Math.floor(Math.random() * PALETTE.length),
      };
    }

    function tick(now: number) {
      if (!running) return;
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.012;
        const flicker = (Math.sin(p.phase) + 1) * 0.5;
        const op = p.o * (0.6 + 0.4 * flicker);

        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const rgb = PALETTE[p.c];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb},${op})`;
        if (!lightweight) {
          ctx!.shadowColor = `rgba(${rgb},${op * 0.8})`;
          ctx!.shadowBlur = p.r * 4;
        }
        ctx!.fill();
      }
      if (!lightweight) ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    }

    resize();
    if (!reduceMotion) raf = requestAnimationFrame(tick);
    else {
      // Static render once for reduced motion
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PALETTE[p.c]},${p.o * 0.7})`;
        ctx.fill();
      }
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      resize();
      if (!reduceMotion) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [density, maxOpacity, lightweight]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    />
  );
}
