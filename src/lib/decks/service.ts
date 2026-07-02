import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { decks } from "@/lib/db/schema";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseClient>>;
type DrizzleDb = ReturnType<typeof import("@/lib/db/client").getDb>;

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
  data: { name: string; description?: string },
) {
  const rows = await db
    .insert(decks)
    .values({
      userId,
      name: data.name,
      description: data.description ?? null,
    })
    .returning();
  return toDeck(rows[0]);
}

export async function updateDeck(
  db: DrizzleDb,
  userId: string,
  id: string,
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
      and(eq(decks.userId, userId), eq(decks.id, id), isNull(decks.archivedAt)),
    )
    .returning();
  const row = rows[0];
  return row ? toDeck(row) : null;
}

export async function archiveDeck(db: DrizzleDb, userId: string, id: string) {
  const rows = await db
    .update(decks)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(decks.userId, userId), eq(decks.id, id), isNull(decks.archivedAt)),
    )
    .returning({ id: decks.id });
  return rows.length > 0;
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
  return rows.length > 0;
}

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}
