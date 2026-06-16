import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boladas & Emprego",
  description: "Vagas de emprego em Moçambique actualizadas diariamente. Candidate-se de forma simples e rápida com a MUIANGA CONSULTORES.",
  openGraph: {
    title: "Boladas & Emprego | MUIANGA CONSULTORES",
    description: "Vagas de emprego em Moçambique actualizadas diariamente.",
    url: "https://muiangaconsultores.co.mz/emprego",
  },
};

export default function EmpregoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
