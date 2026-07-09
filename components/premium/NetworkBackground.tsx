"use client";
import { useEffect, useRef } from "react";

/**
 * Lightweight animated network background.
 *
 * Business rationale (consultancy platform):
 *  - Visually represents "connecting talent, business and opportunity"
 *  - Single <canvas> node — no DOM bloat, no extra libs
 *  - ~30 nodes max, GPU-friendly transforms
 *  - Respects prefers-reduced-motion
 *  - Pauses when tab is hidden (battery + CPU)
 *  - No mouse interactivity that triggers reflow
 *
 * Total cost: ~3.5 KB minified, zero dependencies.
 */
export default function NetworkBackground({
  className = "",
  density = 0.00004,
  linkDistance = 160,
}: {
  className?: string;
  density?: number;
  linkDistance?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Paleta dourada — profundidade tonal (luz → bronze)
    const PALETTE: [number, number, number][] = [
      [232, 199, 102],  // ouro claro  #E8C766
      [212, 175, 55],   // âmbar       #D4AF37
      [201, 168, 76],   // ouro marca  #C9A84C
      [168, 124, 46],   // bronze      #A87C2E
    ];
    type Node = { x: number; y: number; vx: number; vy: number; r: number; c: number };
    let nodes: Node[] = [];
    let raf = 0;
    let running = true;
    let w = 0, h = 0;

    function resize() {
      const parent = canvas!.parentElement;
      w = parent?.clientWidth ?? window.innerWidth;
      h = parent?.clientHeight ?? window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);

      const count = Math.max(20, Math.min(45, Math.floor(w * h * density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.8,
        c: Math.floor(Math.random() * PALETTE.length),
      }));
    }

    function step() {
      if (!running) return;
      ctx!.clearRect(0, 0, w, h);

      // Update positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // Draw links (between close nodes) — soft gold
      const ld2 = linkDistance * linkDistance;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < ld2) {
            const alpha = (1 - d2 / ld2) * 0.28;
            // Mistura das cores dos dois nós ligados
            const ca = PALETTE[a.c];
            const cb = PALETTE[b.c];
            const r = Math.round((ca[0] + cb[0]) / 2);
            const g = Math.round((ca[1] + cb[1]) / 2);
            const bl = Math.round((ca[2] + cb[2]) / 2);
            ctx!.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
            ctx!.lineWidth = 0.7;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // Draw nodes — cada um com a sua cor viva
      for (const n of nodes) {
        const [r, g, b] = PALETTE[n.c];
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},0.9)`;
        ctx!.shadowColor = `rgba(${r},${g},${b},0.7)`;
        ctx!.shadowBlur = 10;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      raf = requestAnimationFrame(step);
    }

    resize();
    if (!reduceMotion) raf = requestAnimationFrame(step);
    else {
      // Static frame for reduced-motion users
      step();
      running = false;
      cancelAnimationFrame(raf);
    }

    const onResize = () => { cancelAnimationFrame(raf); resize(); if (!reduceMotion) { running = true; raf = requestAnimationFrame(step); } };
    const onVisibility = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!reduceMotion) { running = true; raf = requestAnimationFrame(step); }
    };

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, linkDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    />
  );
}
