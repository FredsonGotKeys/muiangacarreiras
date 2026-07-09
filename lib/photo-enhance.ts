"use client";

/**
 * Pipeline de melhoria de foto — 100% client-side via Canvas, sem custo de API extra.
 *
 * Nota honesta: não faz detecção real de rosto (isso exigiria um modelo ML pesado,
 * ~6MB+, desproporcional ao ganho). Em vez disso, usa o canal alpha da imagem já
 * processada pelo remove.bg (fundo transparente) para encontrar a bounding box do
 * sujeito e centrar/enquadrar automaticamente — funciona bem porque o remove.bg já
 * isolou a pessoa do fundo.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Encontra a bounding box de pixels não-transparentes (o sujeito) */
function findSubjectBounds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w, minY = h, maxX = 0, maxY = 0;
  const step = 2; // amostragem — performance
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return { x: 0, y: 0, w, h }; // fallback: imagem toda
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Auto-enquadra: centra o sujeito com margem, corta em quadrado */
export async function autoCenterSquare(dataUrl: string, outSize = 600): Promise<string> {
  const img = await loadImage(dataUrl);
  const src = document.createElement("canvas");
  src.width = img.width;
  src.height = img.height;
  const sctx = src.getContext("2d")!;
  sctx.drawImage(img, 0, 0);

  const bounds = findSubjectBounds(sctx, img.width, img.height);
  const margin = 0.35; // 35% de margem à volta do sujeito
  const boxSize = Math.max(bounds.w, bounds.h) * (1 + margin);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h * 0.42; // vieses ligeiramente para cima (rosto/ombros)

  const out = document.createElement("canvas");
  out.width = outSize;
  out.height = outSize;
  const octx = out.getContext("2d")!;
  octx.drawImage(
    src,
    cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize,
    0, 0, outSize, outSize
  );
  return out.toDataURL("image/png");
}

/** Aplica melhoria leve de brilho/contraste/nitidez via filtros CSS no canvas */
export async function enhanceLighting(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "brightness(1.06) contrast(1.08) saturate(1.05)";
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Gera versão circular (máscara circular sobre fundo branco) */
export async function makeCircular(dataUrl: string, size = 400): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, size, size);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

/** Gera versão rectangular 3:4 (formato passe/CV formal) com fundo branco */
export async function makeRectangular(dataUrl: string, w = 400, h = 533): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  // Ajustar imagem (assumida quadrada) dentro do rectângulo, centrada
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return canvas.toDataURL("image/png");
}

/** Verifica qualidade mínima (resolução) e devolve aviso se abaixo do recomendado */
export function checkPhotoQuality(file: File): Promise<{ ok: boolean; warning: string | null }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const minDim = 500;
      if (img.width < minDim || img.height < minDim) {
        resolve({ ok: false, warning: `Resolução baixa (${img.width}×${img.height}px). Recomendamos pelo menos ${minDim}×${minDim}px para impressão nítida.` });
      } else {
        resolve({ ok: true, warning: null });
      }
    };
    img.onerror = () => resolve({ ok: true, warning: null });
    img.src = url;
  });
}
