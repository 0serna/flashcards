import Link from "next/link";
import { notFound } from "next/navigation";

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

  return (
    <AppScreen contentClassName="py-4">
      <header className="flex items-start justify-between gap-4 py-6">
        <div className="min-w-0">
          <p className="break-words text-sm text-muted-foreground">
            {deck.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {resolvedMode === "review" ? "Review" : "Practice"}
          </h1>
        </div>
        <Link
          href={`/decks/${deck.id}`}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
        >
          End session
        </Link>
      </header>
      <StudySession
        mode={resolvedMode}
        deckId={deck.id}
        deckName={deck.name}
        initialCards={cards}
        submitRating={boundSubmit}
      />
    </AppScreen>
  );
}
