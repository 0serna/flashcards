import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseRouteParamId } from "@/lib/api/http";
import { cardDeckIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { createCard, listActiveCards } from "@/lib/cards/service";
import {
  MultipartFormError,
  parseCreateImage,
  parseText,
} from "@/lib/api/multipart";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const deckId = await parseRouteParamId(context, "id", cardDeckIdSchema);
  if (deckId instanceof Response) return deckId;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const cards = await listActiveCards(getDb(), supabase, user.id, deckId);
  if (cards === null) return httpErrors.notFound();
  return Response.json(cards);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const deckId = await parseRouteParamId(context, "id", cardDeckIdSchema);
  if (deckId instanceof Response) return deckId;

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return httpErrors.badRequest("Invalid multipart body");
  }

  let frontText: string | null | undefined;
  let backText: string | null | undefined;
  let frontImage: Awaited<ReturnType<typeof parseCreateImage>>;
  let backImage: Awaited<ReturnType<typeof parseCreateImage>>;
  try {
    [frontText, backText, frontImage, backImage] = await Promise.all([
      parseText(formData, "frontText"),
      parseText(formData, "backText"),
      parseCreateImage(formData, "frontImage"),
      parseCreateImage(formData, "backImage"),
    ]);
  } catch (error) {
    if (error instanceof MultipartFormError) {
      return httpErrors.badRequest(error.message);
    }
    return httpErrors.badRequest("Invalid multipart fields");
  }

  if (frontText == null && frontImage === null) {
    return httpErrors.badRequest("Front must include text or an image");
  }
  if (backText == null && backImage === null) {
    return httpErrors.badRequest("Back must include text or an image");
  }

  const card = await createCard(getDb(), supabase, user.id, deckId, {
    front: { text: frontText ?? null, image: frontImage },
    back: { text: backText ?? null, image: backImage },
  });
  if (card === null) return httpErrors.notFound();
  return Response.json(card, { status: 201 });
}
