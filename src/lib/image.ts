/**
 * Downscale + compress an image Blob to a small JPEG data URL. Keeping
 * headshots tiny (~a few tens of KB) means they fit comfortably in a Firestore
 * document (1 MiB limit) and stay cheap to read on the free plan.
 */
export async function compressImageToDataUrl(
  blob: Blob,
  maxSize = 512,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a canvas context.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}
