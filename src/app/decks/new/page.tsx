import { signOutAction } from "@/app/auth/actions";
import { AppScreen } from "@/components/app-screen";
import { DeckForm, DeckFormShell } from "@/components/decks/deck-form";

import { createDeckAction } from "../actions";

export default function NewDeckPage() {
  return (
    <AppScreen contentClassName="py-4" signOutAction={signOutAction}>
      <DeckFormShell
        title="Create deck"
        description="Name the topic you want to remember. Keep it small enough to start today."
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Create deck" },
        ]}
      >
        <DeckForm mode="create" action={createDeckAction} />
      </DeckFormShell>
    </AppScreen>
  );
}
