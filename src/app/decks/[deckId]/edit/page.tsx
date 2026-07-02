import { DeckForm, DeckFormShell } from "@/components/decks/deck-form";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { updateDeckAction } from "../../actions";

type EditDeckPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { deckId } = await params;
  const deck = await loadOwnedActiveDeck(deckId);

  const updateAction = updateDeckAction.bind(null, deck.id);

  return (
    <DeckFormShell
      title="Edit deck"
      description="Rename the deck or adjust its note. Cards and study history stay unchanged."
    >
      <DeckForm mode="edit" action={updateAction} deck={deck} />
    </DeckFormShell>
  );
}
