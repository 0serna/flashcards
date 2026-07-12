import { ChevronRight, ImageIcon, Plus } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { DeckActionsMenu } from "@/components/decks/deck-actions-menu";
import { Button } from "@/components/ui/button";
import { DividedList, DividedListRow } from "@/components/ui/divided-list";
import { getDb } from "@/lib/db/client";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";
import { getAuthenticatedUser } from "@/lib/decks/service";
import {
  countActiveCards,
  hasArchivedCards,
  listActiveCards,
} from "@/lib/cards/service";
import type { Card } from "@/lib/cards/service";
import { countDueReviewCards } from "@/lib/study/service";
import { createClient } from "@/lib/supabase/server";

import { archiveDeckAction } from "../actions";

export const dynamic = "force-dynamic";

type DeckDetailPageProps = {
  params: Promise<{ deckId: string }>;
};

type CardSide = Card["front"];

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const { deckId } = await params;
  const deck = await loadOwnedActiveDeck(deckId);

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return null;
  }

  const [cards, count, due, hasArchived] = await Promise.all([
    listActiveCards(getDb(), supabase, user.id, deck.id),
    countActiveCards(getDb(), user.id, deck.id),
    countDueReviewCards(getDb(), user.id, deck.id),
    hasArchivedCards(getDb(), user.id, deck.id),
  ]);
  const safeCount = count ?? 0;
  const dueNow = due ?? 0;
  const safeCards = cards ?? [];
  const archiveAction = archiveDeckAction.bind(null, deck.id);

  return (
    <AppScreen contentClassName="py-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: deck.name }]}
      />

      <header className="space-y-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-balance">
            {deck.name}
          </h1>
          <DeckActionsMenu deckId={deck.id} archiveAction={archiveAction} />
        </div>
        {safeCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {dueNow > 0 ? (
              <Button asChild size="sm">
                <Link
                  href={`/decks/${deck.id}/study?mode=review`}
                  prefetch={false}
                >
                  Study {dueNow} due
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              size="sm"
              variant={dueNow > 0 ? "secondary" : "default"}
            >
              <Link
                href={`/decks/${deck.id}/study?mode=practice`}
                prefetch={false}
              >
                Practice random
              </Link>
            </Button>
          </div>
        ) : null}
      </header>

      <section aria-labelledby="cards-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="cards-heading"
            className="text-base font-semibold tracking-tight"
          >
            Cards ({safeCount})
          </h2>
          <Button
            asChild
            size="sm"
            variant={safeCount > 0 ? "secondary" : "default"}
          >
            <Link href={`/decks/${deck.id}/cards/new`}>
              <Plus aria-hidden="true" />
              Add card
            </Link>
          </Button>
        </div>

        {safeCards.length > 0 ? (
          <DividedList>
            {safeCards.map((card) => {
              const frontText = card.front.text ?? "Image only";
              const backText = card.back.text ?? "Image only";
              return (
                <DividedListRow
                  key={card.id}
                  asChild
                  className="transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Link
                    href={`/decks/${deck.id}/cards/${card.id}/edit`}
                    aria-label={`Edit card: ${frontText}, ${backText}`}
                  >
                    <span className="min-w-0 space-y-1">
                      <span className="flex min-w-0 items-center gap-2 break-words text-sm font-medium">
                        {sideHasImage(card.front) ? (
                          <ImageIcon
                            aria-label="Front has image"
                            className="size-3.5 shrink-0 text-muted-foreground"
                          />
                        ) : null}
                        <span className="min-w-0 break-words">{frontText}</span>
                      </span>
                      <span className="flex min-w-0 items-center gap-2 break-words text-sm text-muted-foreground">
                        {sideHasImage(card.back) ? (
                          <ImageIcon
                            aria-label="Back has image"
                            className="size-3.5 shrink-0"
                          />
                        ) : null}
                        <span className="min-w-0 break-words">{backText}</span>
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </DividedListRow>
              );
            })}
          </DividedList>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            No cards yet. Add one to start studying this deck.
          </p>
        )}
      </section>

      {hasArchived ? (
        <Button asChild variant="ghost" className="mt-4 w-full">
          <Link href={`/decks/${deck.id}/cards/archived`}>Archived cards</Link>
        </Button>
      ) : null}
    </AppScreen>
  );
}

function sideHasImage(side: CardSide) {
  return Boolean(side.imageUrl ?? side.imagePath);
}
