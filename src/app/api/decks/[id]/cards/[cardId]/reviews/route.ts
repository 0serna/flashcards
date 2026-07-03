import { cardReviewRating } from "@/lib/db/enums";

import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseJsonBody, parseRouteParamId } from "@/lib/api/http";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { isStudyRating } from "@/lib/study/scheduler";
import { recordCardReview } from "@/lib/study/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; cardId: string }> },
) {
  const deckId = await parseRouteParamId(context, "id", cardDeckIdSchema);
  if (deckId instanceof Response) return deckId;
  const cardId = await parseRouteParamId(context, "cardId", cardIdSchema);
  if (cardId instanceof Response) return cardId;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  if (typeof body !== "object" || body === null) {
    return httpErrors.badRequest("Invalid payload");
  }
  const ratingValue = (body as { rating?: unknown }).rating;
  if (typeof ratingValue !== "string" || !isStudyRating(ratingValue)) {
    return httpErrors.badRequest(
      `rating must be one of: ${cardReviewRating.join(", ")}`,
    );
  }

  const result = await recordCardReview(
    getDb(),
    user.id,
    deckId,
    cardId,
    ratingValue,
  );
  if (!result.found) return httpErrors.notFound();
  return Response.json(result, { status: 201 });
}
