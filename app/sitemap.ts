import { MetadataRoute } from "next";

const BASE = "https://muiangaconsultores.co.mz";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1 },
    { url: `${BASE}/sobre`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/emprego`,       lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/curriculum`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/contacto`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.6 },
    { url: `${BASE}/termos`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];
}
