import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { decks } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseClient>>;
type DrizzleDb = ReturnType<typeof import("@/lib/db/client").getDb>;

export class DeckIdentityConflictError extends Error {
  constructor() {
    super("Deck identity is unavailable");
    this.name = "DeckIdentityConflictError";
  }
}

export type Deck = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDeck(row: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listActiveDecks(db: DrizzleDb, userId: string) {
  const rows = await db
    .select()
    .from(decks)
    .where(and(eq(decks.userId, userId), isNull(decks.archivedAt)));
  return rows.map(toDeck);
}

export async function listArchivedDecks(db: DrizzleDb, userId: string) {
  const rows = await db
    .select()
    .from(decks)
    .where(and(eq(decks.userId, userId), isNotNull(decks.archivedAt)));
  return rows.map(toDeck);
}

export async function hasArchivedDecks(db: DrizzleDb, userId: string) {
  const rows = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.userId, userId), isNotNull(decks.archivedAt)))
    .limit(1);
  return rows.length > 0;
}

export async function getOwnedActiveDeckRow(
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

export async function getActiveDeck(db: DrizzleDb, userId: string, id: string) {
  const rows = await db
    .select()
    .from(decks)
    .where(
      and(eq(decks.userId, userId), eq(decks.id, id), isNull(decks.archivedAt)),
    );
  const row = rows[0];
  return row ? toDeck(row) : null;
}

export async function createDeck(
  db: DrizzleDb,
  userId: string,
  data: { id: string; name: string; description?: string },
) {
  const existing = await getOwnedDeckById(db, userId, data.id);
  if (existing) return existing;

  try {
    const rows = await db
      .insert(decks)
      .values({
        id: data.id,
        userId,
        name: data.name,
        description: data.description ?? null,
      })
      .returning();
    return toDeck(rows[0]);
  } catch (error) {
    const raced = await getOwnedDeckById(db, userId, data.id);
    if (raced) return raced;
    if (isUniqueViolation(error)) throw new DeckIdentityConflictError();
    throw error;
  }
}

export async function updateDeck(
  db: DrizzleDb,
  userId: string,
  id: string,
  expectedUpdatedAt: string,
  data: { name?: string; description?: string },
) {
  const updates: { name?: string; description?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  const rows = await db
    .update(decks)
    .set(updates)
    .where(
      and(
        eq(decks.userId, userId),
        eq(decks.id, id),
        eq(decks.updatedAt, new Date(expectedUpdatedAt)),
        isNull(decks.archivedAt),
      ),
    )
    .returning();
  const row = rows[0];
  if (row) return { status: "updated" as const, deck: toDeck(row) };

  const current = await getActiveDeck(db, userId, id);
  return current
    ? { status: "stale" as const, deck: current }
    : { status: "not-found" as const };
}

export async function archiveDeck(db: DrizzleDb, userId: string, id: string) {
  const rows = await db
    .update(decks)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(decks.userId, userId), eq(decks.id, id), isNull(decks.archivedAt)),
    )
    .returning({ id: decks.id });
  if (rows.length > 0) return true;
  const existing = await getOwnedDeckById(db, userId, id);
  return existing !== null;
}

export async function restoreDeck(db: DrizzleDb, userId: string, id: string) {
  const rows = await db
    .update(decks)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(decks.userId, userId),
        eq(decks.id, id),
        isNotNull(decks.archivedAt),
      ),
    )
    .returning({ id: decks.id });
  if (rows.length > 0) return true;
  const existing = await getOwnedDeckById(db, userId, id);
  return existing !== null;
}

async function getOwnedDeckById(
  db: DrizzleDb,
  userId: string,
  id: string,
): Promise<Deck | null> {
  const rows = await db
    .select()
    .from(decks)
    .where(and(eq(decks.userId, userId), eq(decks.id, id)))
    .limit(1);
  const row = rows[0];
  return row ? toDeck(row) : null;
}

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}
