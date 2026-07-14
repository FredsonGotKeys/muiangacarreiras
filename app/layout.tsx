import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import BottomNav from "@/components/premium/BottomNav";

const BASE = "https://muiangaconsultores.co.mz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "MUIANGA CARREIRAS: Emprego, CV e Oportunidades em Moçambique",
    template: "%s | MUIANGA CARREIRAS",
  },
  description: "Plataforma moçambicana de empregabilidade: vagas em Moçambique e Europa, criação de CV profissional, orientação de carreira e conexão com empresas.",
  keywords: ["emprego", "carreiras", "vagas", "CV", "currículo", "Moçambique", "Maputo", "PALOP", "candidatura"],
  openGraph: {
    type: "website",
    locale: "pt_MZ",
    url: BASE,
    siteName: "MUIANGA CARREIRAS",
    title: "MUIANGA CARREIRAS: Emprego, CV e Oportunidades em Moçambique",
    description: "Plataforma moçambicana de empregabilidade: vagas, CV profissional e orientação de carreira.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "MUIANGA CARREIRAS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUIANGA CARREIRAS",
    description: "Empregabilidade e carreiras em Moçambique: vagas, CV e oportunidades.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MUIANGA CARREIRAS",
    url: BASE,
    logo: `${BASE}/og-image.jpg`,
    description:
      "Plataforma de empregabilidade em Moçambique: vagas, criação de CV e orientação de carreira.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Maputo",
      addressCountry: "MZ",
    },
    areaServed: ["MZ", "AO", "CV", "ST", "GW", "BR", "PT"],
    sameAs: [] as string[],
  };

  return (
    <html lang="pt">
      <body className="antialiased bg-white text-[#2A0001]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <AuthProvider>
          <Navbar />
          <main className="pb-24 lg:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
