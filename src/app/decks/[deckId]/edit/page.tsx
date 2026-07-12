import { signOutAction } from "@/app/auth/actions";
import { AppScreen } from "@/components/app-screen";
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
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <DeckFormShell
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: "Edit deck" },
        ]}
      >
        <DeckForm mode="edit" action={updateAction} deck={deck} />
      </DeckFormShell>
    </AppScreen>
  );
}
