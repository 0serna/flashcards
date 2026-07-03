import {
  FLASHCARD_IMAGE_ALLOWED_MIME_TYPES,
  FLASHCARD_IMAGE_MAX_BYTES,
} from "./storage";

export const FLASHCARD_IMAGE_OPTIMIZED_MIME_TYPE = "image/webp";
export const FLASHCARD_IMAGE_MAX_EDGE_PIXELS = 1200;
const FLASHCARD_IMAGE_OPTIMIZED_QUALITY = 0.8;

export class FlashcardImageOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardImageOptimizationError";
  }
}

export async function optimizeFlashcardImageFile(file: File): Promise<File> {
  validateOriginalImage(file);

  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(
        1,
        FLASHCARD_IMAGE_MAX_EDGE_PIXELS / Math.max(bitmap.width, bitmap.height),
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return file;

      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await canvasToBlob(canvas);
      if (!blob || blob.size === 0 || blob.size >= file.size) return file;

      return new File([blob], webpFileName(file.name), {
        type: FLASHCARD_IMAGE_OPTIMIZED_MIME_TYPE,
        lastModified: file.lastModified,
      });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

function validateOriginalImage(file: File) {
  if (file.size > FLASHCARD_IMAGE_MAX_BYTES) {
    throw new FlashcardImageOptimizationError("Image must be 5 MB or smaller");
  }
  if (
    !(FLASHCARD_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(
      file.type,
    )
  ) {
    throw new FlashcardImageOptimizationError(
      "Image must be JPEG, PNG, or WebP",
    );
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      FLASHCARD_IMAGE_OPTIMIZED_MIME_TYPE,
      FLASHCARD_IMAGE_OPTIMIZED_QUALITY,
    );
  });
}

function webpFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.webp`;
}
