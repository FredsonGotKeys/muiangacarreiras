"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function FloatingFounderAvatar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) return; // só mobile
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 100;
      setVisible(window.scrollY > 300 && !nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/sobre"
      className={`fixed bottom-5 right-4 z-40 lg:hidden transition-all duration-500 ease-in-out ${
        visible ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"
      }`}
      aria-label="Sobre o fundador"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full border-2 border-[#C9A84C]/60 animate-ping" />
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C9A84C] shadow-xl shadow-black/40 relative">
          <Image
            src="/images/fredson-muianga.jpg"
            alt="Fredson Muianga"
            fill
            className="object-cover object-top"
          />
        </div>
      </div>
    </Link>
  );
}
