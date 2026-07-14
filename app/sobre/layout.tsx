import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: "Conheça a MUIANGA CARREIRAS: a nossa missão, visão, valores e a equipa que transforma o potencial moçambicano em resultados reais.",
  openGraph: {
    title: "Sobre nós | MUIANGA CARREIRAS",
    description: "Conheça a nossa missão, visão e equipa.",
    url: "https://muiangaconsultores.co.mz/sobre",
  },
};

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
