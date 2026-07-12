import { signOutAction } from "@/app/auth/actions";
import { AppScreen } from "@/components/app-screen";
import { DeckForm, DeckFormShell } from "@/components/decks/deck-form";

import { createDeckAction } from "../actions";

export default function NewDeckPage() {
  return (
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <DeckFormShell
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
