import { CARD_IMAGE_MAX_BYTES, isCardImageMimeType } from "@/lib/cards/storage";
import { cardImageMetadataSchema, cardTextSchema } from "@/lib/cards/schema";
import type { CardImage } from "@/lib/cards/service";

export type MultipartImage = CardImage;

export class MultipartFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MultipartFormError";
  }
}

export async function parseCreateImage(
  formData: FormData,
  field: string,
): Promise<MultipartImage | null> {
  for (const entry of formData.getAll(field)) {
    if (entry === "") continue;
    if (typeof entry !== "string" && entry instanceof Blob) {
      if (entry.size === 0) continue;
      return readImageBlob(entry);
    }
    throw new MultipartFormError(`Invalid ${field} value`);
  }
  return null;
}

export async function parseUpdateImage(
  formData: FormData,
  field: string,
): Promise<MultipartImage | "clear" | null> {
  let clear = false;
  for (const entry of formData.getAll(field)) {
    if (entry === "clear") {
      clear = true;
      continue;
    }
    if (entry === "") continue;
    if (typeof entry !== "string" && entry instanceof Blob) {
      if (entry.size === 0) continue;
      return readImageBlob(entry);
    }
    throw new MultipartFormError(`Invalid ${field} value`);
  }
  return clear ? "clear" : null;
}

export async function parseText(
  formData: FormData,
  field: string,
): Promise<string | null | undefined> {
  const value = formData.get(field);
  if (value === null) return undefined;
  if (typeof value !== "string") {
    throw new MultipartFormError(`Invalid ${field} value`);
  }
  const parsed = cardTextSchema.parse(value);
  return parsed === "" ? null : parsed;
}

async function readImageBlob(blob: Blob): Promise<MultipartImage> {
  if (blob.size === 0) {
    throw new MultipartFormError("Image is required");
  }
  if (blob.size > CARD_IMAGE_MAX_BYTES) {
    throw new MultipartFormError("Image must be 5 MB or smaller");
  }
  if (!isCardImageMimeType(blob.type)) {
    throw new MultipartFormError("Image must be JPEG, PNG, or WebP");
  }
  const name = blob instanceof File ? blob.name : "image";
  const meta = cardImageMetadataSchema.parse({
    size: blob.size,
    type: blob.type,
    name,
  });
  return { ...meta, bytes: blob };
}
