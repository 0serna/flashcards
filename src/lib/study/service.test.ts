import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cardReviews, cards, decks } from "@/lib/db/schema";

import {
  countDueReviewCards,
  listActiveStudyCards,
  listDueReviewCards,
  recordCardReview,
} from "./service";
import { DEFAULT_EASE_FACTOR } from "./scheduler";

const supabaseState = {
  signedUrls: [] as string[],
};

function createMockSupabase() {
  return {
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => {
          supabaseState.signedUrls.push(path);
          return { data: { signedUrl: `signed:${path}` }, error: null };
        },
      }),
    },
  } as never;
}

type FakeRow = {
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

function makeDb(options: {
  deck: { id: string; userId: string; archivedAt: Date | null } | null;
  cards?: FakeRow[];
  insertCalls?: Array<Record<string, unknown>>;
  updateCalls?: Array<Record<string, unknown>>;
  insertError?: Error;
  updateError?: Error;
  now?: Date;
}) {
  const decksRows = options.deck ? [options.deck] : [];
  const cardsRows = options.cards ?? [];
  const insertCalls = options.insertCalls ?? [];
  const updateCalls = options.updateCalls ?? [];
  const insertError = options.insertError;
  const updateError = options.updateError;
  const now = options.now;

  const sortByDueAt = (rows: unknown[]) =>
    rows.slice().sort((a, b) => {
      const aDue = (a as { dueAt?: Date }).dueAt?.getTime() ?? 0;
      const bDue = (b as { dueAt?: Date }).dueAt?.getTime() ?? 0;
      return aDue - bDue;
    });

  const resolve = (source: unknown[]) => {
    const sorted = sortByDueAt(source);
    const thenable = {
      limit: async (count: number) => source.slice(0, count),
      orderBy: () => resolve(sorted),
      where: () => resolve(source),
      then: (
        onFulfilled: (value: unknown[]) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(source).then(onFulfilled, onRejected),
    };
    return thenable as unknown as Promise<unknown[]> & {
      limit: (count: number) => Promise<unknown[]>;
      orderBy: () => unknown;
      where: () => unknown;
    };
  };

  const dueCountRows = () => [
    {
      value: cardsRows.filter(
        (card) =>
          card.deckId === deck.id &&
          card.archivedAt === null &&
          now !== undefined &&
          card.dueAt.getTime() <= now.getTime(),
      ).length,
    },
  ];

  const buildSelectFrom = (table: unknown, projection?: unknown) => {
    let source: unknown[] = cardsRows;
    if (table === decks) source = decksRows;
    if (table === cardReviews) source = [];
    if (table === cards && projection) source = dueCountRows();
    return {
      where: () => resolve(source),
      orderBy: () => resolve(sortByDueAt(source)),
      limit: async (count: number) => source.slice(0, count),
    };
  };

  const buildSelect = (projection?: unknown) => ({
    from: (table: unknown) => buildSelectFrom(table, projection),
  });

  const tx = {
    select: () => buildSelect(),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === cardReviews) {
          insertCalls.push(values);
        }
        if (insertError) throw insertError;
        return Promise.resolve({ rowCount: 1 });
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        if (table === cards) {
          updateCalls.push(values);
        }
        if (updateError) throw updateError;
        return {
          where: () => Promise.resolve({ rowCount: 1 }),
        };
      },
    }),
  };

  const db = {
    select: (projection?: unknown) => buildSelect(projection),
    transaction: async (run: (txInner: typeof tx) => Promise<unknown>) =>
      run(tx),
  };

  return { db, insertCalls, updateCalls, tx };
}

const deck = { id: "d1", userId: "u1", archivedAt: null };

beforeEach(() => {
  supabaseState.signedUrls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listDueReviewCards", () => {
  it("returns not found when the deck is missing or unowned", async () => {
    const { db } = makeDb({ deck: null });
    const result = await listDueReviewCards(
      db as never,
      createMockSupabase(),
      "u1",
      "d1",
    );
    expect(result).toEqual({ found: false });
  });

  it("orders due cards by oldest due timestamp first", async () => {
    const now = new Date("2024-01-10T00:00:00.000Z");
    const cardRows: FakeRow[] = [
      {
        id: "c2",
        deckId: "d1",
        frontText: "f2",
        frontImagePath: null,
        backText: "b2",
        backImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
        dueAt: new Date("2024-01-09T00:00:00.000Z"),
        easeFactor: DEFAULT_EASE_FACTOR,
        reviewCount: 0,
        intervalMinutes: 0,
      },
      {
        id: "c1",
        deckId: "d1",
        frontText: "f1",
        frontImagePath: null,
        backText: "b1",
        backImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
        dueAt: new Date("2024-01-08T00:00:00.000Z"),
        easeFactor: DEFAULT_EASE_FACTOR,
        reviewCount: 0,
        intervalMinutes: 0,
      },
    ];
    const { db } = makeDb({ deck, cards: cardRows });
    const result = await listDueReviewCards(
      db as never,
      createMockSupabase(),
      "u1",
      "d1",
      now,
    );
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.cards.map((card) => card.id)).toEqual(["c1", "c2"]);
    }
  });

  it("returns an empty queue when no cards are due", async () => {
    const now = new Date("2024-01-10T00:00:00.000Z");
    const { db } = makeDb({ deck, cards: [] });
    const result = await listDueReviewCards(
      db as never,
      createMockSupabase(),
      "u1",
      "d1",
      now,
    );
    expect(result).toEqual({ found: true, cards: [] });
  });

  it("projects image versions without creating signed Storage URLs", async () => {
    const version = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const now = new Date("2024-01-10T00:00:00.000Z");
    const { db } = makeDb({
      deck,
      cards: [
        {
          id: "c1",
          deckId: "d1",
          frontText: null,
          frontImagePath: `d1/c1/front/${version}-photo.png`,
          backText: "answer",
          backImagePath: null,
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
          dueAt: now,
          easeFactor: DEFAULT_EASE_FACTOR,
          reviewCount: 0,
          intervalMinutes: 0,
        },
      ],
    });

    const result = await listDueReviewCards(
      db as never,
      createMockSupabase(),
      "u1",
      "d1",
      now,
    );

    expect(supabaseState.signedUrls).toEqual([]);
    expect(result).toMatchObject({
      found: true,
      cards: [{ front: { imageUrl: null, imageVersion: version } }],
    });
  });
});

describe("listActiveStudyCards", () => {
  it("returns not found when the deck is missing", async () => {
    const { db } = makeDb({ deck: null });
    const result = await listActiveStudyCards(
      db as never,
      createMockSupabase(),
      "u1",
      "d1",
    );
    expect(result).toEqual({ found: false });
  });

  it("does not create signed Storage URLs for practice cards", async () => {
    const now = new Date("2024-01-10T00:00:00.000Z");
    const { db } = makeDb({
      deck,
      cards: [
        {
          id: "c1",
          deckId: "d1",
          frontText: "question",
          frontImagePath: null,
          backText: null,
          backImagePath:
            "d1/c1/back/f47ac10b-58cc-4372-a567-0e02b2c3d479-photo.webp",
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
          dueAt: now,
          easeFactor: DEFAULT_EASE_FACTOR,
          reviewCount: 0,
          intervalMinutes: 0,
        },
      ],
    });

    await listActiveStudyCards(db as never, createMockSupabase(), "u1", "d1");

    expect(supabaseState.signedUrls).toEqual([]);
  });
});

describe("countDueReviewCards", () => {
  it("returns null for missing decks", async () => {
    const { db } = makeDb({ deck: null });
    const result = await countDueReviewCards(
      db as never,
      "u1",
      "d1",
      new Date(),
    );
    expect(result).toBeNull();
  });

  it("counts only active cards due at or before now", async () => {
    const now = new Date("2024-01-10T00:00:00.000Z");
    const makeCard = (id: string, dueAt: Date, archivedAt: Date | null) => ({
      id,
      deckId: "d1",
      frontText: "f",
      frontImagePath: null,
      backText: "b",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt,
      dueAt,
      easeFactor: DEFAULT_EASE_FACTOR,
      reviewCount: 0,
      intervalMinutes: 0,
    });
    const { db } = makeDb({
      deck,
      cards: [
        makeCard("due-1", new Date("2024-01-09T00:00:00.000Z"), null),
        makeCard("due-2", now, null),
        makeCard("future", new Date("2024-01-11T00:00:00.000Z"), null),
        makeCard("archived", new Date("2024-01-08T00:00:00.000Z"), now),
      ],
      now,
    });

    await expect(
      countDueReviewCards(db as never, "u1", "d1", now),
    ).resolves.toBe(2);
  });
});

describe("recordCardReview", () => {
  it("returns not found when the deck is missing", async () => {
    const { db } = makeDb({ deck: null });
    const result = await recordCardReview(
      db as never,
      "u1",
      "d1",
      "c1",
      "remembered",
      new Date(),
    );
    expect(result).toEqual({ found: false });
  });

  it("returns not found when the card is missing or archived", async () => {
    const { db } = makeDb({ deck, cards: [] });
    const result = await recordCardReview(
      db as never,
      "u1",
      "d1",
      "c1",
      "remembered",
      new Date(),
    );
    expect(result).toEqual({ found: false });
  });

  it("inserts a review and updates the card scheduling state together", async () => {
    const card: FakeRow = {
      id: "c1",
      deckId: "d1",
      frontText: "f",
      frontImagePath: null,
      backText: "b",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      dueAt: new Date("2024-01-01T00:00:00.000Z"),
      easeFactor: DEFAULT_EASE_FACTOR,
      reviewCount: 0,
      intervalMinutes: 0,
    };
    const now = new Date("2024-01-08T00:00:00.000Z");
    const { db, insertCalls, updateCalls } = makeDb({
      deck,
      cards: [card],
    });
    const result = await recordCardReview(
      db as never,
      "u1",
      "d1",
      "c1",
      "remembered",
      now,
    );
    expect(result.found).toBe(true);
    expect(insertCalls).toHaveLength(1);
    expect(updateCalls).toHaveLength(1);
    const update = updateCalls[0] as {
      intervalMinutes: number;
      reviewCount: number;
      easeFactor: number;
      dueAt: Date;
    };
    expect(update.intervalMinutes).toBe(3 * 24 * 60);
    expect(update.reviewCount).toBe(1);
    expect(update.dueAt).toBeInstanceOf(Date);
  });

  it("stores exact scheduling snapshots for a reviewed remembered card", async () => {
    const previousDueAt = new Date("2024-01-01T00:00:00.000Z");
    const reviewedAt = new Date("2024-01-08T00:00:00.000Z");
    const nextDueAt = new Date("2024-01-09T19:20:00.000Z");
    const card: FakeRow = {
      id: "c1",
      deckId: "d1",
      frontText: "f",
      frontImagePath: null,
      backText: "b",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      dueAt: previousDueAt,
      easeFactor: DEFAULT_EASE_FACTOR,
      reviewCount: 4,
      intervalMinutes: 1000,
    };
    const { db, insertCalls, updateCalls } = makeDb({
      deck,
      cards: [card],
    });

    const result = await recordCardReview(
      db as never,
      "u1",
      "d1",
      "c1",
      "remembered",
      reviewedAt,
    );

    expect(result).toEqual({
      found: true,
      rating: "remembered",
      reviewedAt: reviewedAt.toISOString(),
      scheduledMinutes: 2600,
      nextDueAt: nextDueAt.toISOString(),
    });
    expect(updateCalls[0]).toMatchObject({
      dueAt: nextDueAt,
      easeFactor: 2.6,
      reviewCount: 5,
      intervalMinutes: 2600,
      updatedAt: reviewedAt,
    });
    expect(insertCalls[0]).toMatchObject({
      cardId: "c1",
      userId: "u1",
      rating: "remembered",
      reviewedAt,
      previousDueAt,
      nextDueAt,
      scheduledMinutes: 2600,
      previousEaseFactor: DEFAULT_EASE_FACTOR,
      nextEaseFactor: 2.6,
    });
  });

  it("uses the preassigned Review identity and rejects a stale scheduling version", async () => {
    const card: FakeRow = {
      id: "c1",
      deckId: "d1",
      frontText: "f",
      frontImagePath: null,
      backText: "b",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      dueAt: new Date("2024-01-01T00:00:00.000Z"),
      easeFactor: DEFAULT_EASE_FACTOR,
      reviewCount: 2,
      intervalMinutes: 10,
    };
    const { db, insertCalls, updateCalls } = makeDb({ deck, cards: [card] });

    const stale = await recordCardReview(
      db as never,
      "u1",
      "d1",
      "c1",
      "remembered",
      new Date("2024-01-08T00:00:00.000Z"),
      {
        id: "11111111-1111-4111-8111-111111111111",
        expectedReviewCount: 1,
      },
    );

    expect(stale).toEqual({ found: false, reason: "stale" });
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("persists the preassigned Review identity for a current version", async () => {
    const card: FakeRow = {
      id: "c1",
      deckId: "d1",
      frontText: "f",
      frontImagePath: null,
      backText: "b",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      dueAt: new Date("2024-01-01T00:00:00.000Z"),
      easeFactor: DEFAULT_EASE_FACTOR,
      reviewCount: 2,
      intervalMinutes: 10,
    };
    const { db, insertCalls } = makeDb({ deck, cards: [card] });
    const reviewId = "11111111-1111-4111-8111-111111111111";

    const result = await recordCardReview(
      db as never,
      "u1",
      "d1",
      "c1",
      "remembered",
      new Date("2024-01-08T00:00:00.000Z"),
      { id: reviewId, expectedReviewCount: 2 },
    );

    expect(result.found).toBe(true);
    expect(insertCalls[0]).toMatchObject({ id: reviewId });
  });

  it("rolls back when the review insert fails", async () => {
    const card: FakeRow = {
      id: "c1",
      deckId: "d1",
      frontText: "f",
      frontImagePath: null,
      backText: "b",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      dueAt: new Date("2024-01-01T00:00:00.000Z"),
      easeFactor: DEFAULT_EASE_FACTOR,
      reviewCount: 0,
      intervalMinutes: 0,
    };
    const { db } = makeDb({
      deck,
      cards: [card],
      insertError: new Error("boom"),
    });
    await expect(
      recordCardReview(db as never, "u1", "d1", "c1", "remembered", new Date()),
    ).rejects.toThrow("boom");
  });
});
