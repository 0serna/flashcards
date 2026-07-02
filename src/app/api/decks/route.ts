import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseJsonBody } from "@/lib/api/http";
import { deckCreateSchema } from "@/lib/decks/schema";
import {
  createDeck,
  getAuthenticatedUser,
  listActiveDecks,
} from "@/lib/decks/service";

export async function GET() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const decks = await listActiveDecks(getDb(), user.id);
  return Response.json(decks);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const parsed = deckCreateSchema.safeParse(body);
  if (!parsed.success) {
    return httpErrors.badRequest(
      parsed.error.issues[0]?.message ?? "Invalid payload",
    );
  }

  const deck = await createDeck(getDb(), user.id, parsed.data);
  return Response.json(deck, { status: 201 });
}
