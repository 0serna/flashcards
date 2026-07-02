import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { saveMockCardAction } from "../../../actions";

type AddFirstCardPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function AddFirstCardPage({
  params,
}: AddFirstCardPageProps) {
  const { deckId } = await params;
  const deck = await loadOwnedActiveDeck(deckId);
  const saveCardAction = saveMockCardAction.bind(null, deck.id, "deck");
  const saveAnotherAction = saveMockCardAction.bind(null, deck.id, "new-card");

  return (
    <main className="min-h-dvh bg-secondary/30 px-4 py-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col py-4">
        <Link
          href={`/decks/${deck.id}`}
          className="break-words text-sm text-muted-foreground hover:text-foreground"
        >
          {deck.name}
        </Link>

        <header className="py-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Add the first card
          </h1>
          <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
            Add a draft card now. Full card storage will arrive with the card
            backend.
          </p>
        </header>

        <form
          action={saveCardAction}
          className="space-y-5 rounded-xl border border-border bg-background p-4"
        >
          <div className="space-y-2">
            <Label htmlFor="front">Front</Label>
            <textarea
              id="front"
              name="front"
              required
              rows={4}
              placeholder="Question, word, or prompt"
              className="flex min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Back</Label>
            <textarea
              id="back"
              name="back"
              required
              rows={4}
              placeholder="Answer or explanation"
              className="flex min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            />
          </div>
          <div className="flex flex-col gap-3 pt-1">
            <Button type="submit" className="w-full">
              Save card
            </Button>
            <Button
              type="submit"
              formAction={saveAnotherAction}
              variant="secondary"
              className="w-full"
            >
              Save and create another
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/decks/${deck.id}`}>Skip for now</Link>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
