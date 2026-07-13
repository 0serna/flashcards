"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db/client";
import {
  deckCreateSchema,
  deckIdSchema,
  deckUpdateSchema,
} from "@/lib/decks/schema";
import {
  archiveDeck,
  createDeck,
  DeckIdentityConflictError,
  restoreDeck,
  updateDeck,
} from "@/lib/decks/service";
import { confirmed, rejected } from "@/lib/mutations/outcome";

function createFormPayload(formData: FormData) {
  return {
    id: formData.get("intentId"),
    name: formData.get("name"),
    description: formData.get("description"),
  };
}

function updateFormPayload(formData: FormData) {
  return {
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    name: formData.get("name"),
    description: formData.get("description"),
  };
}

export async function createDeckAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = deckCreateSchema.safeParse(createFormPayload(formData));
  if (!parsed.success)
    return rejected("invalid", "Check the deck details and try again.");
  let deck;
  try {
    deck = await createDeck(getDb(), userId, parsed.data);
  } catch (error) {
    if (error instanceof DeckIdentityConflictError) {
      return rejected("invalid", "This deck attempt could not be recovered.");
    }
    throw error;
  }

  revalidatePath("/");
  return confirmed({ id: deck.id });
}

export async function updateDeckAction(deckId: string, formData: FormData) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  const parsed = deckUpdateSchema.safeParse(updateFormPayload(formData));
  if (!parsed.success)
    return rejected("invalid", "Check the deck details and try again.");
  const { expectedUpdatedAt, ...updates } = parsed.data;
  const result = await updateDeck(
    getDb(),
    userId,
    id,
    expectedUpdatedAt,
    updates,
  );
  if (result.status === "stale") {
    return rejected(
      "stale",
      "This deck changed elsewhere. Reload and try again.",
    );
  }
  if (result.status === "not-found") {
    return rejected("not-found", "This deck is no longer available.");
  }

  revalidatePath("/");
  revalidatePath(`/decks/${id}`);
  return confirmed({ id });
}

export async function archiveDeckAction(deckId: string) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  const archived = await archiveDeck(getDb(), userId, id);
  if (!archived)
    return rejected("not-found", "This deck is no longer available.");

  revalidatePath("/");
  revalidatePath("/decks/archived");
  return confirmed({ id });
}

export async function restoreDeckAction(deckId: string) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  const restored = await restoreDeck(getDb(), userId, id);
  if (!restored)
    return rejected("not-found", "This deck is no longer available.");

  revalidatePath("/");
  revalidatePath("/decks/archived");
  return confirmed({ id });
}
