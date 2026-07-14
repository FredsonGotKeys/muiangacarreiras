import { authFetch } from "@/lib/auth-fetch";

/** Guarda um documento (docx) gerado, para o utilizador poder re-descarregar sem gerar de novo. */
export async function guardarDocumento(tipo: string, nomeFicheiro: string, blob: Blob): Promise<void> {
  try {
    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("nomeFicheiro", nomeFicheiro);
    fd.append("ficheiro", blob, nomeFicheiro);
    await authFetch("/api/documentos/upload", { method: "POST", body: fd });
  } catch {
    // Falha ao guardar não deve impedir o download imediato já em curso.
  }
}
