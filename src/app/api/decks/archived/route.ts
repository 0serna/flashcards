import { getDb } from "@/lib/db/client";
import { httpErrors } from "@/lib/api/http";
import { getAuthenticatedUser, listArchivedDecks } from "@/lib/decks/service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const decks = await listArchivedDecks(getDb(), user.id);
  return Response.json(decks);
}
