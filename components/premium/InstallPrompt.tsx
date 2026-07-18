"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mc_install_dismissed_at";
const DISMISS_DIAS = 14;

/**
 * Convite para instalar a app no telemóvel. Nunca aparece se o site já
 * estiver a correr dentro da app instalada (display-mode: standalone) —
 * essa é a forma fiável de "deixar de mostrar assim que estiver a ser
 * usado na app". Só aparece em telemóvel (Android/iOS), nunca em desktop.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [plataforma, setPlataforma] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const jaInstalada =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (jaInstalada) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DIAS * 86400000) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    if (!isIOS && !isAndroid) return;

    if (isIOS) {
      setPlataforma("ios");
      setVisible(true);
      return;
    }

    setPlataforma("android");
    function aoAntesDeInstalar(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", aoAntesDeInstalar);
    return () => window.removeEventListener("beforeinstallprompt", aoAntesDeInstalar);
  }, []);

  function dispensar() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function instalar() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-5 inset-x-4 z-40 lg:max-w-sm lg:left-5 lg:right-auto print:hidden">
      <div
        className="rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
        style={{ background: "rgba(26,0,0,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(210,0,1,0.25)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">Instala a app MUIANGA</p>
          <p className="text-white/50 text-xs leading-snug">
            {plataforma === "ios" ? (
              <>Toca em <span className="font-semibold text-white/75">Partilhar</span> e depois em <span className="font-semibold text-white/75">"Adicionar ao Ecrã Principal"</span></>
            ) : (
              "Acesso mais rápido, sem abrir o browser"
            )}
          </p>
        </div>
        {plataforma === "android" && (
          <button
            onClick={instalar}
            className="shrink-0 bg-[#D20001] hover:bg-[#B40001] text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Instalar
          </button>
        )}
        <button
          onClick={dispensar}
          aria-label="Fechar"
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
