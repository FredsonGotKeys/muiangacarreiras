/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  // Esconde o indicador de dev do Next.js (o badge "N / Issues" no canto)
  devIndicators: false,
  // pdf-parse (pdfjs-dist) usa um worker interno com caminhos/requires que o
  // bundler do Next parte — sem isto, falha em produção com "DOMMatrix is
  // not defined" mesmo em PDFs válidos. mammoth tem o mesmo tipo de
  // problema de empacotamento (falha silenciosa a ler .docx).
  serverExternalPackages: ["pdf-parse", "mammoth"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
