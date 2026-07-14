"use client";
import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { authFetch } from "@/lib/auth-fetch";

type Documento = { id: string; tipo: string; nome_ficheiro: string; created_at: string };

const NOME_TIPO: Record<string, string> = {
  "cv": "CV",
  "carta-apresentacao": "Carta de Apresentação",
  "carta-motivacao": "Carta de Motivação",
  "requerimento": "Requerimento",
  "conversao-ats": "CV optimizado para ATS",
  "traducao-cv": "CV traduzido",
  "simulacao-entrevista": "Guião de Entrevista",
  "analise-cv": "Relatório de Análise do CV",
};

/** Lista dos documentos já pagos/gerados — re-descarregar nunca cobra de novo. */
export default function MeusDocumentos() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [baixando, setBaixando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user) { setDocs([]); setLoading(false); return; }
    setLoading(true);
    const sb = getSupabaseBrowser();
    const { data } = await sb
      .from("documentos_gerados")
      .select("id, tipo, nome_ficheiro, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    setDocs((data as Documento[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  async function descarregar(id: string, nomeFicheiro: string) {
    setBaixando(id);
    try {
      const res = await authFetch("/api/documentos/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = nomeFicheiro;
        a.click();
      }
    } finally {
      setBaixando(null);
    }
  }

  if (!user || (!loading && docs.length === 0)) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 print:hidden">
      <h3 className="text-sm font-bold text-[#2A0001] mb-3 flex items-center gap-2">
        <FileText size={15} className="text-[#D20001]" /> Os teus documentos
      </h3>
      {loading ? (
        <Loader2 size={16} className="animate-spin text-gray-300" />
      ) : (
        <div className="space-y-1.5">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => descarregar(d.id, d.nome_ficheiro)}
              disabled={baixando !== null}
              className="w-full flex items-center justify-between gap-3 text-left px-3 py-2.5 rounded-xl bg-[#FFF8F8] hover:bg-[#D20001]/10 transition-all disabled:opacity-60"
            >
              <span className="text-xs font-semibold text-[#2A0001] truncate">
                {NOME_TIPO[d.tipo] ?? d.tipo}: {d.nome_ficheiro}
              </span>
              {baixando === d.id ? <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" /> : <Download size={14} className="text-[#D20001] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
