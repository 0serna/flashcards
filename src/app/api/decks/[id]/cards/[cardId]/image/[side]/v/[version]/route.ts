import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { httpErrors } from "@/lib/api/http";
import {
  CARD_IMAGE_BUCKET,
  CARD_IMAGE_PRIVATE_CACHE_MAX_AGE_SECONDS,
} from "@/lib/cards/storage";
import { getAuthenticatedUser } from "@/lib/decks/service";
import { resolveOwnedCardImage } from "@/lib/cards/service";

const SUPPORTED_SIDES = new Set(["front", "back"]);

function isSupportedSide(value: string): value is "front" | "back" {
  return SUPPORTED_SIDES.has(value);
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
      cardId: string;
      side: string;
      version: string;
    }>;
  },
) {
  const { id: deckId, cardId, side, version } = await context.params;
  if (!isSupportedSide(side)) return httpErrors.notFound();
  if (!z.uuid().safeParse(version).success) return httpErrors.notFound();

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return httpErrors.unauthorized();

  const owned = await resolveOwnedCardImage(
    getDb(),
    user.id,
    deckId,
    cardId,
    side,
    version,
  );
  if (!owned) return httpErrors.notFound();

  const { data, error } = await supabase.storage
    .from(CARD_IMAGE_BUCKET)
    .download(owned.path);
  if (error || !data) return httpErrors.notFound();

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Cache-Control": `private, max-age=${CARD_IMAGE_PRIVATE_CACHE_MAX_AGE_SECONDS}`,
    },
  });
}
