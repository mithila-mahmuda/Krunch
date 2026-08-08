/** Soft limit for already-compressed tile images stored in the catalog. */
export const MAX_TILE_IMAGE_BYTES = 400_000;

/** Max source file size before we refuse to read (upload or paste). */
const MAX_SOURCE_IMAGE_BYTES = 8_000_000;

const MAX_EDGE_PX = 640;
const JPEG_QUALITY = 0.72;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = dataUrl;
  });
}

/** Compress a data URL so tile photos stay light in IndexedDB. */
export async function compressTileImageDataUrl(
  dataUrl: string,
): Promise<string> {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, width, height);

  try {
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose a PNG, JPG, or WebP image."));
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      reject(new Error("Image is too large (max 8 MB)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        reject(new Error("Could not read that image."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export async function tileImageFromFile(file: File): Promise<string> {
  const raw = await readImageFileAsDataUrl(file);
  return compressTileImageDataUrl(raw);
}

/** Pull an image file from a paste / drop clipboard payload, if present. */
export function imageFileFromClipboardData(
  data: DataTransfer | null | undefined,
): File | null {
  if (!data) return null;

  for (const file of Array.from(data.files ?? [])) {
    if (file.type.startsWith("image/")) return file;
  }

  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }

  return null;
}
