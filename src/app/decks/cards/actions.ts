"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { requireUserId } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db/client";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getActiveDeck } from "@/lib/decks/service";
import {
  archiveCard,
  createCard,
  CardIdentityConflictError,
  getActiveCard,
  restoreCard,
  updateCard,
} from "@/lib/cards/service";
import { createClient } from "@/lib/supabase/server";
import { confirmed, rejected } from "@/lib/mutations/outcome";
import {
  parseCreateImage,
  parseText,
  parseUpdateImage,
} from "@/lib/api/multipart";

import type { CardImage } from "@/lib/cards/service";

export async function createCardAction(
  deckId: string,
  next: "deck" | "new-card",
  formData: FormData,
) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const deck = await getActiveDeck(getDb(), userId, id);
  if (!deck) notFound();

  const intentId = cardIdSchema.safeParse(formData.get("intentId"));
  if (!intentId.success)
    return rejected("invalid", "Could not identify this card attempt.");

  const supabase = await createClient();

  const [frontText, backText, frontImage, backImage] = await Promise.all([
    parseText(formData, "frontText"),
    parseText(formData, "backText"),
    parseCreateImage(formData, "frontImage"),
    parseCreateImage(formData, "backImage"),
  ]);

  if (frontText == null && frontImage === null) {
    throw new Error("Front must include text or an image");
  }
  if (backText == null && backImage === null) {
    throw new Error("Back must include text or an image");
  }

  let card;
  try {
    card = await createCard(getDb(), supabase, userId, id, {
      id: intentId.data,
      front: { text: frontText ?? null, image: frontImage },
      back: { text: backText ?? null, image: backImage },
    });
  } catch (error) {
    if (error instanceof CardIdentityConflictError) {
      return rejected("invalid", "This card attempt could not be recovered.");
    }
    throw error;
  }
  if (!card) return rejected("not-found", "This deck is no longer available.");

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  return confirmed({ id: card.id, next });
}

export async function updateCardAction(
  deckId: string,
  cardId: string,
  formData: FormData,
) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const card = cardIdSchema.parse(cardId);

  const hasFrontText = formData.has("frontText");
  const hasFrontImage = formData.has("frontImage");
  const hasBackText = formData.has("backText");
  const hasBackImage = formData.has("backImage");

  if (!hasFrontText && !hasFrontImage && !hasBackText && !hasBackImage) {
    throw new Error("At least one side must be provided");
  }

  const front: { text?: string | null; image?: CardImage | null } = {};
  const back: { text?: string | null; image?: CardImage | null } = {};

  if (hasFrontText) front.text = await parseText(formData, "frontText");
  if (hasFrontImage) {
    const parsed = await parseUpdateImage(formData, "frontImage");
    if (parsed === "clear") front.image = null;
    else if (parsed !== null) front.image = parsed;
  }
  if (hasBackText) back.text = await parseText(formData, "backText");
  if (hasBackImage) {
    const parsed = await parseUpdateImage(formData, "backImage");
    if (parsed === "clear") back.image = null;
    else if (parsed !== null) back.image = parsed;
  }

  const expectedUpdatedAt = formData.get("expectedUpdatedAt");
  if (typeof expectedUpdatedAt !== "string" || !expectedUpdatedAt) {
    return rejected("invalid", "Could not verify the card version.");
  }

  const supabase = await createClient();
  const updated = await updateCard(getDb(), supabase, userId, id, card, {
    expectedUpdatedAt,
    front: hasFrontText || hasFrontImage ? front : undefined,
    back: hasBackText || hasBackImage ? back : undefined,
  });
  if (!updated) {
    const current = await getActiveCard(getDb(), supabase, userId, id, card);
    return current
      ? rejected("stale", "This card changed elsewhere. Reload and try again.")
      : rejected("not-found", "This card is no longer available.");
  }

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/${card}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  return confirmed({ id: card });
}

export async function archiveCardAction(deckId: string, cardId: string) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const card = cardIdSchema.parse(cardId);

  const archived = await archiveCard(getDb(), userId, id, card);
  if (!archived)
    return rejected("not-found", "This card is no longer available.");

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  return confirmed({ id: card });
}

export async function restoreCardAction(deckId: string, cardId: string) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const card = cardIdSchema.parse(cardId);

  const restored = await restoreCard(getDb(), userId, id, card);
  if (!restored)
    return rejected("not-found", "This card is no longer available.");

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  return confirmed({ id: card });
}
