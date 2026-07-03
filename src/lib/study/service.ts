import { and, asc, count, eq, isNull, lte } from "drizzle-orm";

import { cardReviews, cards, decks } from "@/lib/db/schema";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { signCardImages, toCard } from "@/lib/cards/service";
import { scheduleReview } from "./scheduler";
import type { ReviewRating, ScheduleOutput } from "./scheduler";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseClient>>;
type DrizzleDb = ReturnType<typeof import("@/lib/db/client").getDb>;

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
  dueAt: Date;
  easeFactor: number;
  reviewCount: number;
  intervalMinutes: number;
};

export type StudyCard = Awaited<ReturnType<typeof toCard>>;

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

export type ListStudyCardsResult =
  { found: false } | { found: true; cards: StudyCard[] };

function dueReviewCardsFilter(deckId: string, now: Date) {
  return and(
    eq(cards.deckId, deckId),
    isNull(cards.archivedAt),
    lte(cards.dueAt, now),
  );
}

export async function listDueReviewCards(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  now: Date = new Date(),
): Promise<ListStudyCardsResult> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return { found: false };

  const rows = (await db
    .select()
    .from(cards)
    .where(dueReviewCardsFilter(deckId, now))
    .orderBy(asc(cards.dueAt), asc(cards.id))) as CardRow[];

  const result = await Promise.all(
    rows.map(async (row) => toCard(row, await signCardImages(supabase, row))),
  );
  return { found: true, cards: result };
}

export async function listActiveStudyCards(
  db: DrizzleDb,
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
): Promise<ListStudyCardsResult> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return { found: false };

  const rows = (await db
    .select()
    .from(cards)
    .where(and(eq(cards.deckId, deckId), isNull(cards.archivedAt)))
    .orderBy(asc(cards.createdAt), asc(cards.id))) as CardRow[];

  const result = await Promise.all(
    rows.map(async (row) => toCard(row, await signCardImages(supabase, row))),
  );
  return { found: true, cards: result };
}

export async function countDueReviewCards(
  db: DrizzleDb,
  userId: string,
  deckId: string,
  now: Date = new Date(),
): Promise<number | null> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return null;

  const rows = await db
    .select({ value: count() })
    .from(cards)
    .where(dueReviewCardsFilter(deckId, now));
  return rows[0]?.value ?? 0;
}

export type ReviewOutcome =
  | { found: false }
  | {
      found: true;
      rating: ReviewRating;
      reviewedAt: string;
      scheduledMinutes: number;
      nextDueAt: string;
    };

export async function recordCardReview(
  db: DrizzleDb,
  userId: string,
  deckId: string,
  cardId: string,
  rating: ReviewRating,
  now: Date = new Date(),
): Promise<ReviewOutcome> {
  const deck = await getOwnedActiveDeckRow(db, userId, deckId);
  if (!deck) return { found: false };

  return await db.transaction(async (tx) => {
    const rows = (await tx
      .select()
      .from(cards)
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.deckId, deckId),
          isNull(cards.archivedAt),
        ),
      )
      .limit(1)) as CardRow[];
    const card = rows[0];
    if (!card) return { found: false as const };

    const schedule: ScheduleOutput = scheduleReview({
      rating,
      previousDueAt: card.dueAt,
      previousEaseFactor: card.easeFactor,
      previousReviewCount: card.reviewCount,
      previousIntervalMinutes: card.intervalMinutes,
      reviewedAt: now,
    });

    await tx
      .update(cards)
      .set({
        dueAt: schedule.nextDueAt,
        easeFactor: schedule.nextEaseFactor,
        reviewCount: schedule.nextReviewCount,
        intervalMinutes: schedule.nextIntervalMinutes,
        updatedAt: now,
      })
      .where(eq(cards.id, cardId));

    await tx.insert(cardReviews).values({
      cardId,
      userId,
      rating,
      reviewedAt: now,
      previousDueAt: schedule.previousDueAt,
      nextDueAt: schedule.nextDueAt,
      scheduledMinutes: schedule.scheduledMinutes,
      previousEaseFactor: card.easeFactor,
      nextEaseFactor: schedule.nextEaseFactor,
    });

    return {
      found: true as const,
      rating,
      reviewedAt: now.toISOString(),
      scheduledMinutes: schedule.scheduledMinutes,
      nextDueAt: schedule.nextDueAt.toISOString(),
    };
  });
}
