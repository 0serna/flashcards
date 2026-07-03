import Link from "next/link";
import { redirect } from "next/navigation";

import { AppScreen } from "@/components/app-screen";
import { Button } from "@/components/ui/button";
import { getMockCardSummary } from "@/lib/cards/mock-summary";
import { getDb } from "@/lib/db/client";
import { getAuthenticatedUser, listArchivedDecks } from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";

import { restoreDeckAction } from "../actions";

export default async function ArchivedDecksPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");

  const decks = await listArchivedDecks(getDb(), user.id);

  return (
    <AppScreen contentClassName="py-4">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Home
      </Link>

      <header className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Archived decks
        </h1>
      </header>

      {decks.length > 0 ? (
        <div className="divide-y divide-border rounded-xl border border-border bg-background">
          {decks.map((deck) => {
            const summary = getMockCardSummary(deck.id);
            const restoreAction = restoreDeckAction.bind(null, deck.id);

            return (
              <div key={deck.id} className="min-w-0 space-y-3 p-4">
                <div className="min-w-0">
                  <h2 className="break-words font-medium">{deck.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {summary.totalLabel}
                  </p>
                </div>
                <form action={restoreAction}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full whitespace-normal break-words"
                  >
                    Restore {deck.name}
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          No archived decks.
        </p>
      )}
    </AppScreen>
  );
}
