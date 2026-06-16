import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Fale connosco. Estamos presentes em Moçambique, Angola, Brasil, Portugal, Cabo Verde e São Tomé e Príncipe.",
  openGraph: {
    title: "Contacto | MUIANGA CONSULTORES",
    description: "Fale connosco. Presentes em 6 países lusófonos.",
    url: "https://muiangaconsultores.co.mz/contacto",
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
