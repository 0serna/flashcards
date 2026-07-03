"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/lib/db/client";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getActiveDeck, getAuthenticatedUser } from "@/lib/decks/service";
import {
  archiveCard,
  createCard,
  restoreCard,
  updateCard,
} from "@/lib/cards/service";
import { createClient } from "@/lib/supabase/server";
import {
  parseCreateImage,
  parseText,
  parseUpdateImage,
} from "@/lib/api/multipart";

import type { CardImage } from "@/lib/cards/service";

async function requireUserId() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");
  return user.id;
}

export async function createCardAction(
  deckId: string,
  next: "deck" | "new-card",
  formData: FormData,
) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const deck = await getActiveDeck(getDb(), userId, id);
  if (!deck) notFound();

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

  await createCard(getDb(), supabase, userId, id, {
    front: { text: frontText ?? null, image: frontImage },
    back: { text: backText ?? null, image: backImage },
  });

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  if (next === "new-card") {
    redirect(`/decks/${id}/cards/new`);
  }
  redirect(`/decks/${id}`);
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

  const supabase = await createClient();
  const updated = await updateCard(getDb(), supabase, userId, id, card, {
    front: hasFrontText || hasFrontImage ? front : undefined,
    back: hasBackText || hasBackImage ? back : undefined,
  });
  if (!updated) notFound();

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/${card}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  redirect(`/decks/${id}`);
}

export async function archiveCardAction(deckId: string, cardId: string) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const card = cardIdSchema.parse(cardId);

  const archived = await archiveCard(getDb(), userId, id, card);
  if (!archived) notFound();

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  redirect(`/decks/${id}`);
}

export async function restoreCardAction(deckId: string, cardId: string) {
  const userId = await requireUserId();
  const id = cardDeckIdSchema.parse(deckId);
  const card = cardIdSchema.parse(cardId);

  const restored = await restoreCard(getDb(), userId, id, card);
  if (!restored) notFound();

  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/cards/archived`);
  redirect(`/decks/${id}/cards/archived`);
}
