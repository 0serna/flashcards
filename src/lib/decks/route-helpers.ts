import { notFound, redirect } from "next/navigation";

import { getDb } from "@/lib/db/client";
import { deckIdSchema } from "@/lib/decks/schema";
import { getActiveDeck, getAuthenticatedUser } from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";

import type { Deck } from "@/lib/decks/service";

export async function loadOwnedActiveDeck(deckId: string): Promise<Deck> {
  const parsedId = deckIdSchema.safeParse(deckId);
  if (!parsedId.success) notFound();

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");

  const deck = await getActiveDeck(getDb(), user.id, parsedId.data);
  if (!deck) notFound();

  return deck;
}
