import { notFound } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { Breadcrumb } from "@/components/app/breadcrumb";
import { AppScreen } from "@/components/app-screen";
import { CardForm } from "@/components/cards/card-form";
import { getDb } from "@/lib/db/client";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { cardImageUrl, getActiveCard } from "@/lib/cards/service";
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
    <AppScreen contentClassName="pb-4" signOutAction={signOutAction}>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: deck.name, href: `/decks/${deck.id}` },
          { label: "Edit card" },
        ]}
      />

      <CardForm
        mode="edit"
        action={updateAction}
        archiveAction={archiveAction}
        cancelHref={`/decks/${deck.id}`}
        submitLabel="Save changes"
        initial={{
          updatedAt: card.updatedAt,
          front: {
            text: card.front.text ?? "",
            imageUrl: cardImageUrl(card, "front", card.front.imageVersion),
          },
          back: {
            text: card.back.text ?? "",
            imageUrl: cardImageUrl(card, "back", card.back.imageVersion),
          },
        }}
      />
    </AppScreen>
  );
}
