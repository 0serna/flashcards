import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getMockCardSummary } from "@/lib/cards/mock-summary";
import { getDb } from "@/lib/db/client";
import {
  getAuthenticatedUser,
  hasArchivedDecks,
  listActiveDecks,
} from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");

  const db = getDb();
  const decks = await listActiveDecks(db, user.id);
  const hasArchived = await hasArchivedDecks(db, user.id);

  return (
    <main className="min-h-dvh bg-secondary/30 px-4 py-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between py-2">
          <Logo className="text-base" />
          <AccountMenu signOutAction={signOutAction} />
        </header>

        <section className="pt-8">
          <p className="text-sm text-muted-foreground">Good evening</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            What do you want to study today?
          </h1>
          <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
            Open a deck you already have, or create a small one for the next
            thing you want to remember.
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
              {decks.map((deck) => {
                const summary = getMockCardSummary(deck.id);
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
                        {summary.dueLabel} · {summary.totalLabel}
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
      </div>
    </main>
  );
}
