import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { PendingActionForm } from "@/components/app/pending-action-form";
import { AppScreen } from "@/components/app-screen";
import { Button } from "@/components/ui/button";
import {
  DividedList,
  DividedListStackedRow,
} from "@/components/ui/divided-list";
import { getDb } from "@/lib/db/client";
import { getAuthenticatedUser, listArchivedDecks } from "@/lib/decks/service";
import { countActiveCards } from "@/lib/cards/service";
import { createClient } from "@/lib/supabase/server";

import { restoreDeckAction } from "../actions";

export default async function ArchivedDecksPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");

  const db = getDb();
  const decks = await listArchivedDecks(db, user.id);
  const counts = await Promise.all(
    decks.map((deck) => countActiveCards(db, user.id, deck.id)),
  );

  return (
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Archived decks" }]}
      />

      {decks.length > 0 ? (
        <DividedList>
          {decks.map((deck, index) => {
            const restoreAction = restoreDeckAction.bind(null, deck.id);
            const count = counts[index] ?? 0;
            return (
              <DividedListStackedRow key={deck.id}>
                <div className="min-w-0">
                  <h2 className="break-words font-medium">{deck.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {count} {count === 1 ? "card" : "cards"}
                  </p>
                </div>
                <PendingActionForm action={restoreAction} successHref="/">
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full whitespace-normal break-words"
                  >
                    Restore {deck.name}
                  </Button>
                </PendingActionForm>
              </DividedListStackedRow>
            );
          })}
        </DividedList>
      ) : (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          No archived decks.
        </p>
      )}
    </AppScreen>
  );
}
