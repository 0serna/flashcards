import { DeckForm, DeckFormShell } from "@/components/decks/deck-form";

import { createDeckAction } from "../actions";

export default function NewDeckPage() {
  return (
    <DeckFormShell
      title="Create deck"
      description="Name the topic you want to remember. Keep it small enough to start today."
    >
      <DeckForm mode="create" action={createDeckAction} />
    </DeckFormShell>
  );
}
