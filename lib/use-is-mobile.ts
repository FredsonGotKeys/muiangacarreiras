"use client";
import { useEffect, useState } from "react";

/**
 * Detecta viewport mobile (<768px) para desligar camadas decorativas pesadas
 * (canvas com sombras, glassmorphism, blur) em dispositivos de baixa/média gama.
 * SSR-safe: assume false no primeiro render, actualiza no mount.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}
