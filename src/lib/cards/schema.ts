import { z } from "zod";

import {
  FLASHCARD_IMAGE_MAX_BYTES,
  FLASHCARD_IMAGE_ALLOWED_MIME_TYPES,
} from "./storage";

export const cardIdSchema = z.uuid();
export const cardDeckIdSchema = z.uuid();

export const cardTextSchema = z
  .string()
  .trim()
  .max(2000, "Text must be 2000 characters or fewer");

export const cardOptionalTextSchema = cardTextSchema
  .optional()
  .or(z.literal("").transform(() => undefined));

const imageMimeTypeSchema = z
  .string()
  .refine(
    (value) =>
      (FLASHCARD_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(value),
    "Image must be JPEG, PNG, or WebP",
  );

export const cardImageMetadataSchema = z.object({
  size: z
    .number()
    .int()
    .nonnegative()
    .max(FLASHCARD_IMAGE_MAX_BYTES, "Image must be 5 MB or smaller"),
  type: imageMimeTypeSchema,
  name: z.string().min(1),
});

export type CardImageMetadata = z.infer<typeof cardImageMetadataSchema>;

export const cardImagePathSchema = z
  .string()
  .regex(/^[A-Za-z0-9._/-]+$/, "Image path is invalid");

/**
 * Extract the immutable version segment from a stored card image path.
 * The path has shape `<deckId>/<cardId>/<side>/<uuid>-<name>`; the UUID
 * prefix is the unique version identifier used by the public image
 * route. Returns `null` when no UUID can be parsed.
 */
const UUID_AT_START_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractImageVersion(path: string | null): string | null {
  if (!path) return null;
  const last = path.split("/").pop() ?? "";
  const match = last.match(UUID_AT_START_PATTERN);
  return match ? match[0] : null;
}
const sideContentSchema = z
  .object({
    text: cardOptionalTextSchema,
    imagePath: cardImagePathSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.text) || Boolean(value.imagePath), {
    message: "Each side must include text or an image",
  });

const sideUpdateSchema = z
  .object({
    text: cardOptionalTextSchema.optional(),
    imagePath: cardImagePathSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => value.text !== undefined || value.imagePath !== undefined,
    { message: "At least one side property must be provided" },
  )
  .refine(
    (value) =>
      value.text === undefined && value.imagePath === undefined
        ? true
        : Boolean(value.text) || value.imagePath !== null,
    { message: "Each side must include text or an image" },
  );

export const cardCreateSchema = z
  .object({
    front: sideContentSchema,
    back: sideContentSchema,
  })
  .strict();

export const cardUpdateSchema = z
  .object({
    front: sideUpdateSchema.optional(),
    back: sideUpdateSchema.optional(),
  })
  .strict()
  .refine((value) => value.front !== undefined || value.back !== undefined, {
    message: "At least one side must be provided",
  });

export type CardCreate = z.infer<typeof cardCreateSchema>;
export type CardUpdate = z.infer<typeof cardUpdateSchema>;
