"use server";

import { revalidatePath } from "next/cache";

import { cardReviewRating } from "@/lib/db/enums";
import { getDb } from "@/lib/db/client";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { isStudyRating } from "@/lib/study/scheduler";
import { recordCardReview } from "@/lib/study/service";
import { createClient } from "@/lib/supabase/server";

export type SubmitRatingResult = { ok: true } | { ok: false; error: string };

export async function submitRatingAction(
  deckId: string,
  cardId: string,
  rating: string,
): Promise<SubmitRatingResult> {
  if (!isStudyRating(rating)) {
    return {
      ok: false,
      error: `Rating must be one of: ${cardReviewRating.join(", ")}`,
    };
  }

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { ok: false, error: "You need to sign in to study." };
  }

  const id = cardDeckIdSchema.parse(deckId);
  const card = cardIdSchema.parse(cardId);

  const result = await recordCardReview(getDb(), user.id, id, card, rating);
  if (!result.found) {
    return { ok: false, error: "Card not found" };
  }

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/study`);
  return { ok: true };
}
