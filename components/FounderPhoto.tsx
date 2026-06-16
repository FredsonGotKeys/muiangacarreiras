"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function FounderPhoto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Só activa no mobile (< 1024px)
    if (window.innerWidth >= 1024) return;

    const onScroll = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      // Começa a encolher quando o container sai do viewport
      setScrolled(top < -80);
      // Esconde o avatar quando o utilizador chega ao fim da página
      const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 100;
      setVisible(!nearBottom);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Foto normal — sempre visível no container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-gray-200 shadow-xl lg:block"
      >
        <Image
          src="/images/fredson-muianga.jpg"
          alt="Fredson Bernardo Muianga — Fundador & CEO"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm">"Moçambique tem talento.</p>
            <p className="text-[#C9A84C] font-bold text-sm">A MUIANGA é a ponte."</p>
          </div>
        </div>
      </div>

      {/* Avatar flutuante — aparece no mobile ao rolar */}
      <div
        className={`
          fixed bottom-5 right-4 z-40 lg:hidden
          transition-all duration-500 ease-in-out
          ${scrolled && visible ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"}
        `}
      >
        {/* Anel dourado animado */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-full border-2 border-[#C9A84C]/60 animate-ping" />
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C9A84C] shadow-xl shadow-black/40 relative">
            <Image
              src="/images/fredson-muianga.jpg"
              alt="Fredson Muianga"
              fill
              className="object-cover object-top"
            />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-[#0D0D0D] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Fredson Muianga · CEO
          </div>
        </div>
      </div>
    </>
  );
}
