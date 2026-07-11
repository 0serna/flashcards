import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { FlashcardForm } from "@/components/cards/flashcard-form";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { createCardAction } from "../../../cards/actions";

type AddFirstCardPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function AddFirstCardPage({
  params,
}: AddFirstCardPageProps) {
  const { deckId } = await params;
  const deck = await loadOwnedActiveDeck(deckId);
  const saveCardAction = createCardAction.bind(null, deck.id, "deck");
  const saveAnotherAction = createCardAction.bind(null, deck.id, "new-card");

  return (
    <AppScreen contentClassName="py-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: "Add card" },
        ]}
      />

      <header className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Add the first card
        </h1>
        <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
          Front and back can each include text, an image, or both. Save to
          return to the deck or save and add another to keep building.
        </p>
      </header>

      <FlashcardForm
        mode="create"
        action={saveCardAction}
        alternativeAction={saveAnotherAction}
        cancelHref={`/decks/${deck.id}`}
        submitLabel="Save card"
      />
    </AppScreen>
  );
}
