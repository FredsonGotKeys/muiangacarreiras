"use client";
import { useRef, useState } from "react";
import { UploadCloud, Loader2, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/AuthModal";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export default function ImportarCv({
  onImported,
}: {
  onImported: (extraido: Record<string, unknown>) => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function onFileSelected(file: File) {
    if (!user) { setPendingFile(file); setShowAuth(true); return; }
    handleFile(file);
  }

  async function handleFile(file: File) {
    setError(null);
    setSuccess(false);
    setFileName(file.name);

    if (file.size > MAX_BYTES) {
      setError("Ficheiro demasiado grande (máx 8 MB).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

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
        borderColor: loading ? "#FE0000" : "rgba(254,0,0,0.35)",
        background: "rgba(254,0,0,0.04)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected(f); if (inputRef.current) inputRef.current.value = ""; }}
      />

      {loading ? (
          <div key="loading" className="flex flex-col items-center gap-2 py-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#FE0000" }} />
            <p className="text-xs text-gray-500">
              A estruturar dados de <span className="font-semibold">{fileName}</span>...
            </p>
          </div>
        ) : success ? (
          <div key="success" className="flex flex-col items-center gap-2 py-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            <p className="text-xs text-gray-600">
              <span className="font-semibold">{fileName}</span> importado, revê os dados nos campos abaixo.
            </p>
            <button onClick={() => inputRef.current?.click()} className="text-[11px] font-semibold text-gray-400 hover:text-[#FE0000] mt-1">
              Importar outro ficheiro
            </button>
          </div>
        ) : (
          <button
            key="idle"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-3"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(254,0,0,0.12)" }}>
              <UploadCloud className="w-6 h-6" style={{ color: "#FE0000" }} />
            </div>
            <p className="text-sm font-semibold text-[#2A0001]">Já tens um CV? Importa e continua a partir dele</p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> PDF ou DOCX: lemos e estruturamos tudo automaticamente
            </p>
          </button>
        )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mt-3 text-left">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-600">{error}</p>
        </div>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => { setShowAuth(false); setPendingFile(null); }}
          onSuccess={() => {
            setShowAuth(false);
            if (pendingFile) { handleFile(pendingFile); setPendingFile(null); }
          }}
        />
      )}
    </div>
  );
}
