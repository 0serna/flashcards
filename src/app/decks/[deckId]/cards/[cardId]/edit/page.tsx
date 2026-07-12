import { Archive } from "lucide-react";
import { notFound } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { FlashcardForm } from "@/components/cards/flashcard-form";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getActiveCard } from "@/lib/cards/service";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";
import { loadOwnedActiveDeck } from "@/lib/decks/route-helpers";

import { archiveCardAction, updateCardAction } from "../../../../cards/actions";

type EditCardPageProps = {
  params: Promise<{ deckId: string; cardId: string }>;
};

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { deckId, cardId } = await params;
  const parsedDeck = cardDeckIdSchema.safeParse(deckId);
  const parsedCard = cardIdSchema.safeParse(cardId);
  if (!parsedDeck.success || !parsedCard.success) notFound();

  const deck = await loadOwnedActiveDeck(deckId);
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) notFound();

  const card = await getActiveCard(getDb(), supabase, user.id, deckId, cardId, {
    width: 640,
    height: 480,
    resize: "contain",
  });
  if (!card) notFound();

  const updateAction = updateCardAction.bind(null, deck.id, card.id);
  const archiveAction = archiveCardAction.bind(null, deck.id, card.id);

  return (
    <AppScreen contentClassName="py-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: "Edit card" },
        ]}
      />

      <header className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Edit card
        </h1>
      </header>

      <div className="space-y-6">
        <FlashcardForm
          mode="edit"
          action={updateAction}
          cancelHref={`/decks/${deck.id}`}
          submitLabel="Save changes"
          initial={{
            front: {
              text: card.front.text ?? "",
              imageUrl: card.front.imageUrl,
            },
            back: { text: card.back.text ?? "", imageUrl: card.back.imageUrl },
          }}
        />
        <form action={archiveAction}>
          <Button type="submit" variant="destructive" className="w-full">
            <Archive aria-hidden="true" />
            Archive card
          </Button>
        </form>
      </div>
    </AppScreen>
  );
}
