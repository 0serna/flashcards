import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type EmailInput = z.infer<typeof emailSchema>;
