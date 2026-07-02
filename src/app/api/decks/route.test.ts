import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  listActiveDecks: vi.fn(),
  createDeck: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  listActiveDecks: mocks.listActiveDecks,
  createDeck: mocks.createDeck,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET, POST } from "./route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/decks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/decks", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.listActiveDecks).not.toHaveBeenCalled();
  });

  it("returns only active decks owned by the user", async () => {
    const user = { id: "user-1", email: "u@example.com" };
    const decks = [
      {
        id: "deck-1",
        name: "Active",
        description: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.listActiveDecks.mockResolvedValue(decks);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.listActiveDecks).toHaveBeenCalledWith({}, user.id);
    await expect(response.json()).resolves.toEqual(decks);
  });
});

describe("POST /api/decks", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(jsonRequest({ name: "Test" }));

    expect(response.status).toBe(401);
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("creates a deck for an authenticated user with a valid payload", async () => {
    const user = { id: "user-1", email: "u@example.com" };
    const created = {
      id: "deck-1",
      name: "Spanish basics",
      description: "Common words",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.createDeck.mockResolvedValue(created);

    const response = await POST(
      jsonRequest({ name: "  Spanish basics  ", description: "Common words" }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createDeck).toHaveBeenCalledWith({}, user.id, {
      name: "Spanish basics",
      description: "Common words",
    });
    await expect(response.json()).resolves.toEqual(created);
  });

  it("rejects a missing name with 400", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    });
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("rejects unknown fields with 400", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await POST(jsonRequest({ name: "ok", archivedAt: "x" }));

    expect(response.status).toBe(400);
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });
});
