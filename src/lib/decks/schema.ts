import { z } from "zod";

export const deckNameSchema = z
  .string({ error: "Name is required" })
  .trim()
  .min(1, "Name is required")
  .max(120, "Name must be 120 characters or fewer");

export const deckDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional();

export const deckIdSchema = z.uuid();

export const deckCreateSchema = z
  .object({
    name: deckNameSchema,
    description: deckDescriptionSchema,
  })
  .strict();

export const deckUpdateSchema = z
  .object({
    name: deckNameSchema.optional(),
    description: deckDescriptionSchema,
  })
  .strict()
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.description === null,
    { message: "At least one field must be provided" },
  );
