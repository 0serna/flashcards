import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

import { DeckActionsMenu } from "@/components/decks/deck-actions-menu";
import { Button } from "@/components/ui/button";
import { getMockCardSummary } from "@/lib/cards/mock-summary";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { archiveDeckAction } from "../actions";

type DeckDetailPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const { deckId } = await params;
  const deck = await loadOwnedActiveDeck(deckId);

  const summary = getMockCardSummary(deck.id);
  const archiveAction = archiveDeckAction.bind(null, deck.id);

  return (
    <main className="min-h-dvh bg-secondary/30 px-4 py-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col py-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Home
        </Link>

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
        </header>

        <section className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold tracking-tight">Ready to study</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {summary.dueLabel} · {summary.totalLabel}
              </p>
            </div>
            <BookOpen
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="mt-5 flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={`/decks/${deck.id}/study`}>Study now</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/decks/${deck.id}/cards/new`}>
                <Plus aria-hidden="true" />
                Add card
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
