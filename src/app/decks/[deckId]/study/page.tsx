import { notFound } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { StudySession } from "@/components/study/study-session";
import type { StudyCardPayload } from "@/components/study/study-session";
import { getDb } from "@/lib/db/client";
import { listActiveStudyCards, listDueReviewCards } from "@/lib/study/service";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { submitRatingAction } from "./actions";

export const dynamic = "force-dynamic";

type StudyPageProps = {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ mode?: string | string[] }>;
};

function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = cards.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function parseMode(
  value: string | string[] | undefined,
): "review" | "practice" {
  if (Array.isArray(value)) value = value[0];
  return value === "practice" ? "practice" : "review";
}

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { deckId } = await params;
  const { mode } = await searchParams;
  const resolvedMode = parseMode(mode);
  const deck = await loadOwnedActiveDeck(deckId);

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) notFound();

  const result =
    resolvedMode === "review"
      ? await listDueReviewCards(getDb(), supabase, user.id, deck.id)
      : await listActiveStudyCards(getDb(), supabase, user.id, deck.id);

  if (!result.found) notFound();

  const cards: StudyCardPayload[] = result.cards.map((card) => ({
    id: card.id,
    deckId: card.deckId,
    front: { text: card.front.text, imageUrl: card.front.imageUrl },
    back: { text: card.back.text, imageUrl: card.back.imageUrl },
  }));

  const boundSubmit = submitRatingAction.bind(null, deck.id);
  const orderedCards =
    resolvedMode === "practice" ? shuffleCards(cards) : cards;
  const modeLabel = resolvedMode === "review" ? "Review" : "Practice";

  return (
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: modeLabel },
        ]}
      />

      <StudySession
        mode={resolvedMode}
        deckId={deck.id}
        deckName={deck.name}
        initialCards={orderedCards}
        submitRating={boundSubmit}
      />
    </AppScreen>
  );
}
