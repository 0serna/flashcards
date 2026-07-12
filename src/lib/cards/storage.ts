export const CARD_IMAGE_BUCKET = "flashcard-images";

export const CARD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const CARD_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Private browser cache lifetime for versioned image responses. */
export const CARD_IMAGE_PRIVATE_CACHE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const CARD_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CardImageMimeType = (typeof CARD_IMAGE_ALLOWED_MIME_TYPES)[number];

export function isCardImageMimeType(value: string): value is CardImageMimeType {
  return (CARD_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}
