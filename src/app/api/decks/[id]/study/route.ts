import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseRouteParamId } from "@/lib/api/http";
import { cardDeckIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { listActiveStudyCards, listDueReviewCards } from "@/lib/study/service";

type StudyMode = "review" | "practice";

function parseStudyMode(value: string | null): StudyMode | null {
  if (value === "review" || value === "practice") return value;
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const deckId = await parseRouteParamId(context, "id", cardDeckIdSchema);
  if (deckId instanceof Response) return deckId;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const url = new URL(request.url);
  const mode = parseStudyMode(url.searchParams.get("mode"));
  if (!mode) {
    return httpErrors.badRequest("mode must be 'review' or 'practice'");
  }

  const result =
    mode === "review"
      ? await listDueReviewCards(getDb(), supabase, user.id, deckId)
      : await listActiveStudyCards(getDb(), supabase, user.id, deckId);

  if (!result.found) return httpErrors.notFound();
  return Response.json({ mode, cards: result.cards });
}
