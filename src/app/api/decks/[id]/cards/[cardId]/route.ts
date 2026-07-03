import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors, parseRouteParamId } from "@/lib/api/http";
import { cardDeckIdSchema, cardIdSchema } from "@/lib/cards/schema";
import { getAuthenticatedUser } from "@/lib/decks/service";
import {
  archiveCard,
  CardContentError,
  getActiveCard,
  updateCard,
} from "@/lib/cards/service";
import {
  MultipartFormError,
  parseUpdateImage,
  parseText,
} from "@/lib/api/multipart";

export async function GET(
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

  const card = await getActiveCard(getDb(), supabase, user.id, deckId, cardId);
  if (card === null) return httpErrors.notFound();
  return Response.json(card);
}

export async function PATCH(
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return httpErrors.badRequest("Invalid multipart body");
  }

  const hasFrontText = formData.has("frontText");
  const hasFrontImage = formData.has("frontImage");
  const hasBackText = formData.has("backText");
  const hasBackImage = formData.has("backImage");

  if (!hasFrontText && !hasFrontImage && !hasBackText && !hasBackImage) {
    return httpErrors.badRequest("At least one side must be provided");
  }

  const front: {
    text?: string | null;
    image?: import("@/lib/cards/service").CardImage | null;
  } = {};
  const back: {
    text?: string | null;
    image?: import("@/lib/cards/service").CardImage | null;
  } = {};

  try {
    if (hasFrontText) front.text = await parseText(formData, "frontText");
    if (hasFrontImage) {
      const parsed = await parseUpdateImage(formData, "frontImage");
      if (parsed === "clear") {
        front.image = null;
      } else if (parsed !== null) {
        front.image = parsed;
      }
    }
    if (hasBackText) back.text = await parseText(formData, "backText");
    if (hasBackImage) {
      const parsed = await parseUpdateImage(formData, "backImage");
      if (parsed === "clear") {
        back.image = null;
      } else if (parsed !== null) {
        back.image = parsed;
      }
    }
  } catch (error) {
    if (error instanceof MultipartFormError) {
      return httpErrors.badRequest(error.message);
    }
    return httpErrors.badRequest("Invalid multipart fields");
  }

  let card;
  try {
    card = await updateCard(getDb(), supabase, user.id, deckId, cardId, {
      front: hasFrontText || hasFrontImage ? front : undefined,
      back: hasBackText || hasBackImage ? back : undefined,
    });
  } catch (error) {
    if (error instanceof CardContentError) {
      return httpErrors.badRequest(error.message);
    }
    throw error;
  }
  if (card === null) return httpErrors.notFound();
  return Response.json(card);
}

export async function DELETE(
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

  const archived = await archiveCard(getDb(), user.id, deckId, cardId);
  if (!archived) return httpErrors.notFound();
  return Response.json({ archived: true });
}
