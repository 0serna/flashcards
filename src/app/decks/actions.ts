"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/lib/db/client";
import {
  deckCreateSchema,
  deckIdSchema,
  deckUpdateSchema,
} from "@/lib/decks/schema";
import {
  archiveDeck,
  createDeck,
  getActiveDeck,
  getAuthenticatedUser,
  restoreDeck,
  updateDeck,
} from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";

async function requireUserId() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");
  return user.id;
}

function formPayload(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
  };
}

export async function createDeckAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = deckCreateSchema.parse(formPayload(formData));
  const deck = await createDeck(getDb(), userId, parsed);

  revalidatePath("/");
  redirect(`/decks/${deck.id}/cards/new`);
}

export async function updateDeckAction(deckId: string, formData: FormData) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  const parsed = deckUpdateSchema.parse(formPayload(formData));
  await updateDeck(getDb(), userId, id, parsed);

  revalidatePath("/");
  revalidatePath(`/decks/${id}`);
  redirect(`/decks/${id}`);
}

export async function archiveDeckAction(deckId: string) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  await archiveDeck(getDb(), userId, id);

  revalidatePath("/");
  revalidatePath("/decks/archived");
  redirect("/");
}

export async function restoreDeckAction(deckId: string) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  await restoreDeck(getDb(), userId, id);

  revalidatePath("/");
  revalidatePath("/decks/archived");
  redirect("/");
}

export async function saveMockCardAction(
  deckId: string,
  next: "deck" | "new-card",
  _formData: FormData,
) {
  const userId = await requireUserId();
  const id = deckIdSchema.parse(deckId);
  const deck = await getActiveDeck(getDb(), userId, id);
  if (!deck) notFound();

  revalidatePath(`/decks/${id}`);
  redirect(next === "new-card" ? `/decks/${id}/cards/new` : `/decks/${id}`);
}
