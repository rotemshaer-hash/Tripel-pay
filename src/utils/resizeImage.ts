/** Draws the file at a bounded size and hands back the canvas, so the two exports
 * below share one decode instead of each doing their own. */
function drawResized(file: File, maxSize: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no-canvas-context"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image-load-failed"));
    };
    img.src = objectUrl;
  });
}

// Shrinks an uploaded photo to a small JPEG data URL before it's stored inline on the
// record — right for a profile picture or a supplier logo, which are small, one-off,
// and load with the record. Wrong for anything that can arrive in bulk: see
// `resizeImageToBlob` for evidence photos, which go to Storage instead.
export async function resizeImageToDataUrl(file: File, maxSize = 320, quality = 0.82): Promise<string> {
  const canvas = await drawResized(file, maxSize);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Shrinks a photo and hands back the bytes, for uploading rather than embedding.
 *
 * A job's evidence can run to dozens of shots — a leak in one unit, a delivery at
 * twenty sites — and the whole family record loads as one object on every sign-in.
 * A handful of inline photos is a convenience; fifty of them is a record too big to
 * load quickly, on every device, forever. This is the same resize as the inline
 * path, just handed to Storage instead of embedded, so evidence scales with the job
 * instead of with what the database record can carry.
 */
export function resizeImageToBlob(file: File, maxSize = 1600, quality = 0.82): Promise<Blob> {
  return drawResized(file, maxSize).then(
    (canvas) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no-blob"))), "image/jpeg", quality);
      })
  );
}
