import { getDb } from "@/lib/db/client";
import { httpErrors, parseRouteParamId } from "@/lib/api/http";
import { deckIdSchema } from "@/lib/decks/schema";
import { getAuthenticatedUser, restoreDeck } from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseRouteParamId(context, deckIdSchema);
  if (id instanceof Response) return id;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const restored = await restoreDeck(getDb(), user.id, id);
  if (!restored) return httpErrors.notFound();
  return Response.json({ restored: true });
}
