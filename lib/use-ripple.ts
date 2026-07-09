"use client";
import { useCallback } from "react";

/**
 * Hook leve para efeito ripple em cliques — usa apenas transform/opacity (GPU).
 * Uso: <button className="ripple-container" onClick={useRipple()}>...</button>
 * Combinar com onClick próprio: onClick={(e) => { ripple(e); minhaFuncao(); }}
 */
export function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement("span");
    span.className = "ripple-effect";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  }, []);
}
