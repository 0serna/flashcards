import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseJsonBody, parseRouteParamId } from "@/lib/api/http";
import { deckIdSchema, deckUpdateSchema } from "@/lib/decks/schema";
import {
  archiveDeck,
  getActiveDeck,
  getAuthenticatedUser,
  updateDeck,
} from "@/lib/decks/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseRouteParamId(context, deckIdSchema);
  if (id instanceof Response) return id;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const deck = await getActiveDeck(getDb(), user.id, id);
  if (!deck) return httpErrors.notFound();
  return Response.json(deck);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseRouteParamId(context, deckIdSchema);
  if (id instanceof Response) return id;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const parsed = deckUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return httpErrors.badRequest(
      parsed.error.issues[0]?.message ?? "Invalid payload",
    );
  }

  const deck = await updateDeck(getDb(), user.id, id, parsed.data);
  if (!deck) return httpErrors.notFound();
  return Response.json(deck);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseRouteParamId(context, deckIdSchema);
  if (id instanceof Response) return id;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const archived = await archiveDeck(getDb(), user.id, id);
  if (!archived) return httpErrors.notFound();
  return Response.json({ archived: true });
}
