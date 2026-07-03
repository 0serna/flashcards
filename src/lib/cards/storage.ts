export const FLASHCARD_IMAGE_BUCKET = "flashcard-images";

export const FLASHCARD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const FLASHCARD_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60;

export const FLASHCARD_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type FlashcardImageMimeType =
  (typeof FLASHCARD_IMAGE_ALLOWED_MIME_TYPES)[number];

export function isFlashcardImageMimeType(
  value: string,
): value is FlashcardImageMimeType {
  return (FLASHCARD_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(
    value,
  );
}
