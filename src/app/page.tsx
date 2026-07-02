import { ChevronRight, Plus, Settings2 } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const decks = [
  {
    name: "Spanish Basics",
    href: "/decks/spanish-basics",
    due: "12 cards due",
    total: "48 cards",
  },
  {
    name: "Biology Terms",
    href: "/decks/biology-terms",
    due: "Ready tomorrow",
    total: "31 cards",
  },
  {
    name: "Product Notes",
    href: "/decks/product-notes",
    due: "4 cards due",
    total: "19 cards",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-secondary/30 px-4 py-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between py-2">
          <Logo className="text-base" />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Account settings"
          >
            <Link href="/account">
              <Settings2 aria-hidden="true" />
            </Link>
          </Button>
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

          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-background">
            {decks.map((deck) => (
              <Link
                key={deck.href}
                href={deck.href}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>
                  <span className="block font-medium">{deck.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {deck.due} · {deck.total}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
