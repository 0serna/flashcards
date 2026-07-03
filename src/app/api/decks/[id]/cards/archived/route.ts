import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseRouteParamId } from "@/lib/api/http";
import { cardDeckIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { listArchivedCards } from "@/lib/cards/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const deckId = await parseRouteParamId(context, "id", cardDeckIdSchema);
  if (deckId instanceof Response) return deckId;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const cards = await listArchivedCards(getDb(), supabase, user.id, deckId);
  if (cards === null) return httpErrors.notFound();
  return Response.json(cards);
}
