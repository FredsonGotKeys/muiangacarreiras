"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Loader2, AlertTriangle, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export default function ImportarCv({
  onImported,
}: {
  onImported: (extraido: Record<string, unknown>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isImageFlow, setIsImageFlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function isImage(name: string) {
    return IMAGE_EXT.some((ext) => name.toLowerCase().endsWith(ext));
  }

  async function handleFile(file: File) {
    setError(null);
    setSuccess(false);
    setFileName(file.name);

    if (file.size > MAX_BYTES) {
      setError("Ficheiro demasiado grande (máx 8 MB).");
      return;
    }

    const imagem = isImage(file.name);
    setIsImageFlow(imagem);

    const formData = new FormData();
    formData.append(imagem ? "image" : "file", file);

    setLoading(true);
    try {
      const res = await authFetch("/api/curriculum/importar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao importar o CV.");
      } else {
        setSuccess(true);
        onImported(data.extraido);
      }
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 text-center border-2 border-dashed transition-colors"
      style={{
        borderColor: loading ? "#06B6D4" : "rgba(6,182,212,0.35)",
        background: "rgba(6,182,212,0.04)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); if (inputRef.current) inputRef.current.value = ""; }}
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 py-3">
            {isImageFlow ? <Sparkles className="w-7 h-7 animate-pulse" style={{ color: "#06B6D4" }} /> : <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#06B6D4" }} />}
            <p className="text-xs text-gray-500">
              {isImageFlow ? "A IA está a ler a foto do teu CV..." : <>A estruturar dados de <span className="font-semibold">{fileName}</span> com IA...</>}
            </p>
          </motion.div>
        ) : success ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2 py-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            <p className="text-xs text-gray-600">
              <span className="font-semibold">{fileName}</span> importado — revê os dados nos campos abaixo.
            </p>
            <button onClick={() => inputRef.current?.click()} className="text-[11px] font-semibold text-gray-400 hover:text-[#06B6D4] mt-1">
              Importar outro ficheiro
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-3"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)" }}>
              <UploadCloud className="w-6 h-6" style={{ color: "#06B6D4" }} />
            </div>
            <p className="text-sm font-semibold text-[#0D0D0D]">Já tens um CV? Importa e continua a partir dele</p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> PDF, DOCX ou foto (JPG/PNG) — a IA lê e estrutura tudo
            </p>
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mt-3 text-left">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
