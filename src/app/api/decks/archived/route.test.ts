import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  listArchivedDecks: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  listArchivedDecks: mocks.listArchivedDecks,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
});

describe("GET /api/decks/archived", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.listArchivedDecks).not.toHaveBeenCalled();
  });

  it("returns archived decks owned by the user", async () => {
    const user = { id: "user-1" };
    const decks = [
      {
        id: "deck-1",
        name: "Archived",
        description: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.listArchivedDecks.mockResolvedValue(decks);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.listArchivedDecks).toHaveBeenCalledWith({}, user.id);
    await expect(response.json()).resolves.toEqual(decks);
  });
});
