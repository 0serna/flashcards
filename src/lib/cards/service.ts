import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import { cards, decks } from "@/lib/db/schema";
import {
  isFlashcardImageMimeType,
  FLASHCARD_IMAGE_BUCKET,
  FLASHCARD_IMAGE_SIGNED_URL_TTL_SECONDS,
} from "./storage";
import type { CardImageMetadata } from "./schema";

export type CardImage = CardImageMetadata & { bytes: Blob };

export class CardContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardContentError";
  }
}

type DrizzleDb = ReturnType<typeof import("@/lib/db/client").getDb>;

export type CardSideContent = {
  text: string | null;
  imagePath: string | null;
  imageUrl: string | null;
};

export type Card = {
  id: string;
  deckId: string;
  front: CardSideContent;
  back: CardSideContent;
  createdAt: string;
  updatedAt: string;
};

type CardImageTransform = {
  height: number;
  resize: "contain";
  width: number;
};

type CardRow = {
  id: string;
  deckId: string;
  frontText: string | null;
  frontImagePath: string | null;
  backText: string | null;
  backImagePath: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

function toSideContent(
  text: string | null,
  imagePath: string | null,
  urls: { front: string | null; back: string | null },
  side: "front" | "back",
): CardSideContent {
  return {
    text,
    imagePath,
    imageUrl: imagePath ? urls[side] : null,
  };
}

export async function toCard(
  row: CardRow,
  urls: { front: string | null; back: string | null } = {
    front: null,
    back: null,
  },
): Promise<Card> {
  return {
    id: row.id,
    deckId: row.deckId,
    front: toSideContent(row.frontText, row.frontImagePath, urls, "front"),
    back: toSideContent(row.backText, row.backImagePath, urls, "back"),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOwnedActiveDeckRow(
  db: DrizzleDb,
  userId: string,
  deckId: string,
) {
  const rows = await db
    .select()
    .from(decks)
    .where(
      and(
        eq(decks.userId, userId),
        eq(decks.id, deckId),
        isNull(decks.archivedAt),
      ),
    );
  return rows[0] ?? null;
}

export async function signCardImages(
  supabase: SupabaseClient,
  row: CardRow,
  transform?: CardImageTransform,
): Promise<{ front: string | null; back: string | null }> {
  const urls = { front: null as string | null, back: null as string | null };
  const options = transform ? { transform } : undefined;
  if (row.frontImagePath) {
    const { data } = await supabase.storage
      .from(FLASHCARD_IMAGE_BUCKET)
      .createSignedUrl(
        row.frontImagePath,
        FLASHCARD_IMAGE_SIGNED_URL_TTL_SECONDS,
        options,
      );
    urls.front = data?.signedUrl ?? null;
  }
  if (row.backImagePath) {
    const { data } = await supabase.storage
      .from(FLASHCARD_IMAGE_BUCKET)
      .createSignedUrl(
        row.backImagePath,
        FLASHCARD_IMAGE_SIGNED_URL_TTL_SECONDS,
        options,
      );
    urls.back = data?.signedUrl ?? null;
  }
  return urls;
}

export async function listActiveCards(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
): Promise<Card[] | null> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;

  const rows = await db
    .select()
    .from(cards)
    .where(and(eq(cards.deckId, deckId), isNull(cards.archivedAt)))
    .orderBy(desc(cards.createdAt), desc(cards.id));
  return await Promise.all(
    rows.map(async (row) => toCard(row, await signCardImages(supabase, row))),
  );
}

export async function listArchivedCards(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
): Promise<Card[] | null> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;

  const rows = await db
    .select()
    .from(cards)
    .where(and(eq(cards.deckId, deckId), isNotNull(cards.archivedAt)))
    .orderBy(desc(cards.createdAt), desc(cards.id));
  return await Promise.all(
    rows.map(async (row) => toCard(row, await signCardImages(supabase, row))),
  );
}

export async function getActiveCard(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  cardId: string,
  imageTransform?: CardImageTransform,
): Promise<Card | null> {
  const rows = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.id, cardId),
        eq(cards.deckId, deckId),
        isNull(cards.archivedAt),
      ),
    );
  const row = rows[0];
  if (!row) return null;
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;
  return toCard(row, await signCardImages(supabase, row, imageTransform));
}

export type CreateCardInput = {
  front: { text: string | null; image: CardImage | null };
  back: { text: string | null; image: CardImage | null };
};

export async function createCard(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  input: CreateCardInput,
): Promise<Card | null> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;

  const cardId = randomUUID();
  const uploadedPaths: string[] = [];
  let committed = false;

  try {
    const frontPath = input.front.image
      ? await uploadImage(supabase, deckId, cardId, "front", input.front.image)
      : null;
    if (frontPath) uploadedPaths.push(frontPath);
    const backPath = input.back.image
      ? await uploadImage(supabase, deckId, cardId, "back", input.back.image)
      : null;
    if (backPath) uploadedPaths.push(backPath);

    const cardIdRow = await db
      .insert(cards)
      .values({
        id: cardId,
        deckId,
        frontText: input.front.text,
        frontImagePath: frontPath,
        backText: input.back.text,
        backImagePath: backPath,
      })
      .returning();
    const inserted = cardIdRow[0];
    if (!inserted) {
      await cleanupUploadedImages(supabase, uploadedPaths);
      return null;
    }
    committed = true;

    return toCard(inserted, await signCardImages(supabase, inserted));
  } catch (error) {
    if (!committed) await cleanupUploadedImages(supabase, uploadedPaths);
    throw error;
  }
}

export type UpdateCardInput = {
  front?: { text?: string | null; image?: CardImage | null };
  back?: { text?: string | null; image?: CardImage | null };
};

export async function updateCard(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  cardId: string,
  input: UpdateCardInput,
): Promise<Card | null> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;

  const existingRows = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.id, cardId),
        eq(cards.deckId, deckId),
        isNull(cards.archivedAt),
      ),
    );
  const existing = existingRows[0];
  if (!existing) return null;

  const updates: {
    frontText?: string | null;
    frontImagePath?: string | null;
    backText?: string | null;
    backImagePath?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  validateUpdatedSide(
    "Front",
    existing.frontText,
    existing.frontImagePath,
    input.front,
  );
  validateUpdatedSide(
    "Back",
    existing.backText,
    existing.backImagePath,
    input.back,
  );

  let frontImageCleanup: string | null = null;
  let backImageCleanup: string | null = null;
  const uploadedPaths: string[] = [];
  let committed = false;

  try {
    if (input.front) {
      if (input.front.text !== undefined) updates.frontText = input.front.text;
      if (input.front.image === null && existing.frontImagePath) {
        updates.frontImagePath = null;
        frontImageCleanup = existing.frontImagePath;
      } else if (input.front.image) {
        const nextPath = await uploadImage(
          supabase,
          deckId,
          cardId,
          "front",
          input.front.image,
        );
        uploadedPaths.push(nextPath);
        updates.frontImagePath = nextPath;
        if (existing.frontImagePath && existing.frontImagePath !== nextPath) {
          frontImageCleanup = existing.frontImagePath;
        }
      }
    }

    if (input.back) {
      if (input.back.text !== undefined) updates.backText = input.back.text;
      if (input.back.image === null && existing.backImagePath) {
        updates.backImagePath = null;
        backImageCleanup = existing.backImagePath;
      } else if (input.back.image) {
        const nextPath = await uploadImage(
          supabase,
          deckId,
          cardId,
          "back",
          input.back.image,
        );
        uploadedPaths.push(nextPath);
        updates.backImagePath = nextPath;
        if (existing.backImagePath && existing.backImagePath !== nextPath) {
          backImageCleanup = existing.backImagePath;
        }
      }
    }

    const updatedRows = await db
      .update(cards)
      .set(updates)
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.deckId, deckId),
          isNull(cards.archivedAt),
        ),
      )
      .returning();
    const updated = updatedRows[0];
    if (!updated) {
      await cleanupUploadedImages(supabase, uploadedPaths);
      return null;
    }

    committed = true;

    await Promise.all([
      frontImageCleanup ? deleteImage(supabase, frontImageCleanup) : null,
      backImageCleanup ? deleteImage(supabase, backImageCleanup) : null,
    ]);

    return toCard(updated, await signCardImages(supabase, updated));
  } catch (error) {
    if (!committed) await cleanupUploadedImages(supabase, uploadedPaths);
    throw error;
  }
}

export async function archiveCard(
  db: DrizzleDb,
  userId: string,
  deckId: string,
  cardId: string,
): Promise<boolean> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return false;

  const rows = await db
    .update(cards)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(cards.id, cardId),
        eq(cards.deckId, deckId),
        isNull(cards.archivedAt),
      ),
    )
    .returning({ id: cards.id });
  return rows.length > 0;
}

export async function restoreCard(
  db: DrizzleDb,
  userId: string,
  deckId: string,
  cardId: string,
): Promise<boolean> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return false;

  const rows = await db
    .update(cards)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(cards.id, cardId),
        eq(cards.deckId, deckId),
        isNotNull(cards.archivedAt),
      ),
    )
    .returning({ id: cards.id });
  return rows.length > 0;
}

export async function countActiveCards(
  db: DrizzleDb,
  userId: string,
  deckId: string,
): Promise<number | null> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;
  const rows = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.deckId, deckId), isNull(cards.archivedAt)));
  return rows.length;
}

export async function hasArchivedCards(
  db: DrizzleDb,
  userId: string,
  deckId: string,
): Promise<boolean> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return false;
  const rows = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.deckId, deckId), isNotNull(cards.archivedAt)))
    .limit(1);
  return rows.length > 0;
}

function validateUpdatedSide(
  label: "Front" | "Back",
  currentText: string | null,
  currentImagePath: string | null,
  next?: { text?: string | null; image?: CardImage | null },
) {
  if (!next) return;
  const finalText = next.text === undefined ? currentText : next.text;
  const hasFinalImage =
    next.image === undefined ? Boolean(currentImagePath) : next.image !== null;
  if (!finalText && !hasFinalImage) {
    throw new CardContentError(`${label} must include text or an image`);
  }
}

async function cleanupUploadedImages(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(FLASHCARD_IMAGE_BUCKET).remove(paths);
}

function buildImagePath(
  deckId: string,
  cardId: string,
  side: "front" | "back",
  originalName: string,
): string {
  const safeName = originalName
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const base = safeName.length > 0 ? safeName : "image";
  return `${deckId}/${cardId}/${side}/${randomUUID()}-${base}`;
}

async function uploadImage(
  supabase: SupabaseClient,
  deckId: string,
  cardId: string,
  side: "front" | "back",
  image: CardImage,
): Promise<string> {
  if (!isFlashcardImageMimeType(image.type)) {
    throw new Error("Image must be JPEG, PNG, or WebP");
  }
  const path = buildImagePath(deckId, cardId, side, image.name);
  const { error } = await supabase.storage
    .from(FLASHCARD_IMAGE_BUCKET)
    .upload(path, image.bytes, {
      contentType: image.type,
      upsert: false,
    });
  if (error) {
    throw new Error(error.message || "Failed to upload image");
  }
  return path;
}

export async function deleteImage(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  await supabase.storage.from(FLASHCARD_IMAGE_BUCKET).remove([path]);
}
