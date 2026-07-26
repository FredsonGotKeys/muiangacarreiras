import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Fale connosco. Estamos presentes em Moçambique, Angola, Brasil, Portugal, Cabo Verde e São Tomé e Príncipe.",
  openGraph: {
    title: "Contacto | MUIANGA CARREIRAS",
    description: "Fale connosco. Presentes em 6 países lusófonos.",
    url: `${SITE_URL}/contacto`,
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
