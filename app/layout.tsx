import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";

const BASE = "https://muiangaconsultores.co.mz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "MUIANGA CONSULTORES — Consultoria de Excelência em Moçambique",
    template: "%s | MUIANGA CONSULTORES",
  },
  description: "Empresa de consultoria multifuncional baseada em Maputo, Moçambique. Consultoria estratégica, formação, emprego e inovação.",
  keywords: ["consultoria", "Moçambique", "Maputo", "formação", "emprego", "negócios"],
  openGraph: {
    type: "website",
    locale: "pt_MZ",
    url: BASE,
    siteName: "MUIANGA CONSULTORES",
    title: "MUIANGA CONSULTORES — Consultoria de Excelência em Moçambique",
    description: "Empresa de consultoria multifuncional baseada em Maputo, Moçambique. Consultoria estratégica, formação, emprego e inovação.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "MUIANGA CONSULTORES" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUIANGA CONSULTORES",
    description: "Consultoria estratégica, formação, emprego e inovação em Moçambique.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="antialiased bg-white text-[#0D0D0D]">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
