import {
  ChevronRight,
  ImageIcon,
  Plus,
  RotateCcw,
  Shuffle,
} from "lucide-react";
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
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: deck.name }]}
      />

      <header className={safeCount > 0 ? "mb-3 py-2" : "py-2"}>
        {safeCount > 0 ? (
          <div className="flex items-stretch gap-2">
            {dueNow > 0 ? (
              <Button
                asChild
                size="sm"
                className="min-w-0 flex-1 justify-start px-2.5 py-2.5 text-left transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none sm:px-3"
              >
                <Link
                  href={`/decks/${deck.id}/study?mode=review`}
                  prefetch={false}
                  aria-label={`Study ${dueNow} due`}
                >
                  <RotateCcw aria-hidden="true" />
                  <span className="flex flex-col items-start leading-tight">
                    <span>Study</span>
                    <span className="mt-1 text-xs font-normal text-primary-foreground/80">
                      {dueNow} due now
                    </span>
                  </span>
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="min-w-0 flex-1 justify-start px-2.5 py-2.5 text-left transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none sm:px-3"
            >
              <Link
                href={`/decks/${deck.id}/study?mode=practice`}
                prefetch={false}
                aria-label="Practice random"
              >
                <Shuffle aria-hidden="true" />
                <span className="flex flex-col items-start leading-tight">
                  <span>Practice</span>
                  <span className="mt-1 text-xs font-normal text-foreground/70">
                    Random order
                  </span>
                </span>
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
          <div className="flex shrink-0 items-center gap-2">
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
            <DeckActionsMenu deckId={deck.id} archiveAction={archiveAction} />
          </div>
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
        <Button asChild variant="secondary" className="mt-4 w-full">
          <Link href={`/decks/${deck.id}/cards/archived`}>Archived cards</Link>
        </Button>
      ) : null}
    </AppScreen>
  );
}

function sideHasImage(side: CardSide) {
  return Boolean(side.imageUrl ?? side.imagePath);
}
