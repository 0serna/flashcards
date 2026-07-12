import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { Button } from "@/components/ui/button";
import {
  DividedList,
  DividedListStackedRow,
} from "@/components/ui/divided-list";
import { getDb } from "@/lib/db/client";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { listArchivedCards } from "@/lib/cards/service";
import { createClient } from "@/lib/supabase/server";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { restoreCardAction } from "../../../cards/actions";

type ArchivedCardsPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function ArchivedCardsPage({
  params,
}: ArchivedCardsPageProps) {
  const { deckId } = await params;
  const deck = await loadOwnedActiveDeck(deckId);

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");

  const cards = await listArchivedCards(getDb(), supabase, user.id, deck.id);

  return (
    <AppScreen
      contentClassName="py-4"
      signOutAction={signOutAction}
      maxWidthClass="max-w-2xl"
    >
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: "Archived cards" },
        ]}
      />

      <header className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Archived cards
        </h1>
        <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
          Restored cards return to the active deck. Their text and images stay
          intact while archived.
        </p>
      </header>

      {cards && cards.length > 0 ? (
        <DividedList>
          {cards.map((card) => {
            const restoreAction = restoreCardAction.bind(
              null,
              deck.id,
              card.id,
            );
            return (
              <DividedListStackedRow key={card.id}>
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-sm font-medium">
                    {card.front.text ?? "Image only"}
                  </p>
                  <p className="break-words text-sm text-muted-foreground">
                    {card.back.text ?? "Image only"}
                  </p>
                </div>
                <form action={restoreAction}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full whitespace-normal break-words"
                  >
                    Restore card
                  </Button>
                </form>
              </DividedListStackedRow>
            );
          })}
        </DividedList>
      ) : (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          No archived cards.
        </p>
      )}
    </AppScreen>
  );
}
