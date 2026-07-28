import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { EntitlementProvider } from "@/lib/use-entitlement";
import BottomNav from "@/components/premium/BottomNav";
import InstallPrompt from "@/components/premium/InstallPrompt";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MUIANGA CARREIRAS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUIANGA CARREIRAS",
    description: "Empregabilidade e carreiras em Moçambique: vagas, CV e oportunidades.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  other: { "google-adsense-account": "ca-pub-8975008134897996" },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MUIANGA",
  },
};

export const viewport = {
  themeColor: "#D20001",
  colorScheme: "light" as const,
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
    logo: `${BASE}/og-image.png`,
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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8975008134897996"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <EntitlementProvider>
            <Navbar />
            <main className="pb-24 lg:pb-0">{children}</main>
            <Footer />
            <BottomNav />
            <InstallPrompt />
          </EntitlementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
