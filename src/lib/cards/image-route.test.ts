import { beforeEach, describe, expect, it } from "vitest";

import { cardImageUrl, resolveOwnedCardImage } from "./service";
import { extractImageVersion } from "./schema";

const userId = "user-1";
const deckId = "123e4567-e89b-12d3-a456-426614174000";
const cardId = "550e8400-e29b-41d4-a716-446655440000";
const version = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const frontPath = `${deckId}/${cardId}/front/${version}-photo.png`;
const backPath = `${deckId}/${cardId}/back/${version}-answer.webp`;

type Row = {
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

function rowWith(overrides: Partial<Row> = {}): Row {
  return {
    id: cardId,
    deckId,
    frontText: "Front",
    frontImagePath: frontPath,
    backText: "Back",
    backImagePath: backPath,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    ...overrides,
  };
}

function deckRow(overrides: Partial<{ archivedAt: Date | null }> = {}) {
  return { id: deckId, userId, archivedAt: null, ...overrides };
}

function makeDb(
  options: {
    deck?: ReturnType<typeof deckRow> | null;
    card?: Row | null;
  } = {},
) {
  const deck = "deck" in options ? options.deck : deckRow();
  const card = "card" in options ? options.card : rowWith();

  const deckSelect = {
    from: () => ({
      where: async () => (deck === null ? [] : [deck]),
    }),
  };
  const cardSelect = {
    from: () => ({
      where: () => ({
        limit: async () => (card === null ? [] : [card]),
      }),
    }),
  };
  let deckCallCount = 0;
  return {
    select: () => {
      deckCallCount += 1;
      return deckCallCount === 1 ? deckSelect : cardSelect;
    },
  } as never;
}

beforeEach(() => {});

describe("cardImageUrl", () => {
  it("returns a stable, versioned application URL for a side with an image", () => {
    expect(cardImageUrl({ id: cardId, deckId }, "front", version)).toBe(
      `/api/decks/${deckId}/cards/${cardId}/image/front/v/${version}`,
    );
  });

  it("returns null when the version is missing", () => {
    expect(cardImageUrl({ id: cardId, deckId }, "front", null)).toBeNull();
  });
});

describe("extractImageVersion", () => {
  it("extracts the UUID prefix from a stored image path", () => {
    expect(extractImageVersion(frontPath)).toBe(version);
  });

  it("returns null for a path without a UUID prefix", () => {
    expect(extractImageVersion("deck/card/front/some-name.png")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(extractImageVersion(null)).toBeNull();
  });
});

describe("resolveOwnedCardImage", () => {
  it("returns the storage path for the matching version", async () => {
    const db = makeDb();

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "front",
      version,
    );

    expect(result).toEqual({ path: frontPath });
  });

  it("returns the matching back image path", async () => {
    const db = makeDb();

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "back",
      version,
    );

    expect(result).toEqual({ path: backPath });
  });

  it("returns null when the deck is not owned or archived", async () => {
    const db = makeDb({ deck: null });

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "front",
      version,
    );

    expect(result).toBeNull();
  });

  it("returns null when the card does not exist", async () => {
    const db = makeDb({ card: null });

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "front",
      version,
    );

    expect(result).toBeNull();
  });

  it("returns null when the requested side has no image", async () => {
    const db = makeDb({
      card: rowWith({ frontImagePath: null, backImagePath: null }),
    });

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "front",
      version,
    );

    expect(result).toBeNull();
  });

  it("returns null when the requested version does not match the current side image", async () => {
    const staleVersion = "00000000-0000-0000-0000-000000000000";
    const db = makeDb();

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "front",
      staleVersion,
    );

    expect(result).toBeNull();
  });

  it("allows archived cards when the deck is still active and owned", async () => {
    const db = makeDb({ card: rowWith({ archivedAt: new Date() }) });

    const result = await resolveOwnedCardImage(
      db,
      userId,
      deckId,
      cardId,
      "front",
      version,
    );

    expect(result).toEqual({ path: frontPath });
  });
});
