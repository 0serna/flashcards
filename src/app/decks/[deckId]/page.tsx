import { ImageIcon, Plus } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { CardActionsMenu } from "@/components/cards/card-actions-menu";
import { DeckActionsMenu } from "@/components/decks/deck-actions-menu";
import { Button } from "@/components/ui/button";
import { DividedList, DividedListRow } from "@/components/ui/divided-list";
import { getDb } from "@/lib/db/client";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { countActiveCards, listActiveCards } from "@/lib/cards/service";
import type { Card } from "@/lib/cards/service";
import { countDueReviewCards } from "@/lib/study/service";
import { createClient } from "@/lib/supabase/server";

import { archiveCardAction } from "../cards/actions";
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

  const [cards, count, due] = await Promise.all([
    listActiveCards(getDb(), supabase, user.id, deck.id),
    countActiveCards(getDb(), user.id, deck.id),
    countDueReviewCards(getDb(), user.id, deck.id),
  ]);
  const safeCount = count ?? 0;
  const dueNow = due ?? 0;
  const safeCards = cards ?? [];
  const archiveAction = archiveDeckAction.bind(null, deck.id);

  return (
    <AppScreen
      contentClassName="py-4"
      signOutAction={signOutAction}
      maxWidthClass="max-w-2xl"
    >
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: deck.name }]}
      />

      <header className="py-8">
        <p className="text-sm text-muted-foreground">Deck</p>
        <div className="relative mt-2 flex items-start justify-between gap-4">
          <h1 className="min-w-0 break-words text-3xl font-semibold tracking-tight text-balance">
            {deck.name}
          </h1>
          <DeckActionsMenu deckId={deck.id} archiveAction={archiveAction} />
        </div>
        {deck.description ? (
          <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
            {deck.description}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-muted-foreground">
          {dueNow > 0
            ? `${dueNow} due now · ${safeCount} ${safeCount === 1 ? "card" : "cards"}`
            : `${safeCount} ${safeCount === 1 ? "card" : "cards"}`}
        </p>
        <div className="mt-5 space-y-2">
          {dueNow > 0 ? (
            <Button asChild className="w-full">
              <Link
                href={`/decks/${deck.id}/study?mode=review`}
                prefetch={false}
              >
                Study due
              </Link>
            </Button>
          ) : null}
          {safeCount > 0 ? (
            <Button
              asChild
              variant={dueNow > 0 ? "secondary" : "default"}
              className="w-full"
            >
              <Link
                href={`/decks/${deck.id}/study?mode=practice`}
                prefetch={false}
              >
                Practice random
              </Link>
            </Button>
          ) : null}
        </div>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link href={`/decks/${deck.id}/cards/new`}>
            <Plus aria-hidden="true" />
            Add card
          </Link>
        </Button>
      </header>

      {safeCards.length > 0 ? (
        <DividedList>
          {safeCards.map((card) => {
            const cardArchiveAction = archiveCardAction.bind(
              null,
              deck.id,
              card.id,
            );
            return (
              <DividedListRow key={card.id}>
                <div className="min-w-0 space-y-1">
                  <p className="flex min-w-0 items-center gap-2 break-words text-sm font-medium">
                    {sideHasImage(card.front) ? (
                      <ImageIcon
                        aria-label="Front has image"
                        className="size-3.5 shrink-0 text-muted-foreground"
                      />
                    ) : null}
                    <span className="min-w-0 break-words">
                      {card.front.text ?? "Image only"}
                    </span>
                  </p>
                  <p className="flex min-w-0 items-center gap-2 break-words text-sm text-muted-foreground">
                    {sideHasImage(card.back) ? (
                      <ImageIcon
                        aria-label="Back has image"
                        className="size-3.5 shrink-0"
                      />
                    ) : null}
                    <span className="min-w-0 break-words">
                      {card.back.text ?? "Image only"}
                    </span>
                  </p>
                </div>
                <CardActionsMenu
                  deckId={deck.id}
                  cardId={card.id}
                  archiveAction={cardArchiveAction}
                />
              </DividedListRow>
            );
          })}
        </DividedList>
      ) : null}
    </AppScreen>
  );
}

function sideHasImage(side: CardSide) {
  return Boolean(side.imageUrl ?? side.imagePath);
}
