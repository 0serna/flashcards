import { describe, expect, it, vi } from "vitest";

import { archiveDeck, createDeck, restoreDeck, updateDeck } from "./service";

const existing = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "user-1",
  name: "First version",
  description: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  archivedAt: null,
};

function selectable(rows: unknown[]) {
  const result = Promise.resolve(rows) as Promise<unknown[]> & {
    limit: (count: number) => Promise<unknown[]>;
  };
  result.limit = async (count) => rows.slice(0, count);
  return result;
}

describe("Deck mutation reliability", () => {
  it("returns the first owned Deck for a repeated creation identity", async () => {
    const insert = vi.fn();
    const db = {
      select: () => ({
        from: () => ({ where: () => selectable([existing]) }),
      }),
      insert,
    } as never;

    const deck = await createDeck(db, "user-1", {
      id: existing.id,
      name: "Changed retry payload",
    });

    expect(deck.name).toBe("First version");
    expect(insert).not.toHaveBeenCalled();
  });

  it("treats repeated Archive and Restore transitions as confirmed", async () => {
    const db = {
      update: () => ({
        set: () => ({
          where: () => ({ returning: async () => [] }),
        }),
      }),
      select: () => ({
        from: () => ({ where: () => selectable([existing]) }),
      }),
    } as never;

    await expect(archiveDeck(db, "user-1", existing.id)).resolves.toBe(true);
    await expect(restoreDeck(db, "user-1", existing.id)).resolves.toBe(true);
  });

  it("rejects an edit whose expected version is stale", async () => {
    const db = {
      update: () => ({
        set: () => ({
          where: () => ({ returning: async () => [] }),
        }),
      }),
      select: () => ({
        from: () => ({ where: async () => [existing] }),
      }),
    } as never;

    const result = await updateDeck(
      db,
      "user-1",
      existing.id,
      "2023-01-01T00:00:00.000Z",
      { name: "Stale edit" },
    );

    expect(result.status).toBe("stale");
  });
});
