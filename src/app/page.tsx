import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { AppScreen } from "@/components/app-screen";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import {
  getAuthenticatedUser,
  hasArchivedDecks,
  listActiveDecks,
} from "@/lib/decks/service";
import { countActiveCards } from "@/lib/cards/service";
import { countDueReviewCards } from "@/lib/study/service";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");

  const db = getDb();
  const [decks, hasArchived] = await Promise.all([
    listActiveDecks(db, user.id),
    hasArchivedDecks(db, user.id),
  ]);
  const counts = await Promise.all(
    decks.map((deck) => countActiveCards(db, user.id, deck.id)),
  );
  const dueCounts = await Promise.all(
    decks.map((deck) => countDueReviewCards(db, user.id, deck.id)),
  );

  return (
    <AppScreen signOutAction={signOutAction} maxWidthClass="max-w-2xl">
      <section className="pt-8">
        <p className="text-sm text-muted-foreground">Good evening</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
          What do you want to study today?
        </h1>
        <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
          Open a deck you already have, or create a small one for the next thing
          you want to remember.
        </p>
      </section>

      <section className="mt-8 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your decks</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/decks/new">
              <Plus aria-hidden="true" />
              Create a new deck
            </Link>
          </Button>
        </div>

        {decks.length > 0 ? (
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-background">
            {decks.map((deck, index) => {
              const count = counts[index] ?? 0;
              const due = dueCounts[index] ?? 0;
              return (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="flex min-w-0 items-center justify-between gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block break-words font-medium">
                      {deck.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {due > 0
                        ? `${due} due now · ${count} ${count === 1 ? "card" : "cards"}`
                        : `${count} ${count === 1 ? "card" : "cards"}`}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-border bg-background p-4">
            <p className="font-medium">Create your first deck</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Start with one topic. You can add cards after the deck exists.
            </p>
          </div>
        )}

        {hasArchived ? (
          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link href="/decks/archived">Archived decks</Link>
          </Button>
        ) : null}
      </section>
    </AppScreen>
  );
}
