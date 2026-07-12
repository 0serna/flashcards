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
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: "Add card" },
        ]}
      />

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
