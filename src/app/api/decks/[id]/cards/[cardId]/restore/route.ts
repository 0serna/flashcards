import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseRouteParamId } from "@/lib/api/http";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { restoreCard } from "@/lib/cards/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; cardId: string }> },
) {
  const deckId = await parseRouteParamId(context, "id", cardDeckIdSchema);
  if (deckId instanceof Response) return deckId;
  const cardId = await parseRouteParamId(context, "cardId", cardIdSchema);
  if (cardId instanceof Response) return cardId;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const restored = await restoreCard(getDb(), user.id, deckId, cardId);
  if (!restored) return httpErrors.notFound();
  return Response.json({ restored: true });
}
