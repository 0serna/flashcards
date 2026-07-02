import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getActiveDeck: vi.fn(),
  updateDeck: vi.fn(),
  archiveDeck: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  getActiveDeck: mocks.getActiveDeck,
  updateDeck: mocks.updateDeck,
  archiveDeck: mocks.archiveDeck,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { DELETE, GET, PATCH } from "./route";

const deckId = "550e8400-e29b-41d4-a716-446655440000";
const routeParams = { params: Promise.resolve({ id: deckId }) };
const invalidRouteParams = { params: Promise.resolve({ id: "not-a-uuid" }) };

function jsonRequest(method: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
  };
  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    init.body = JSON.stringify(body);
  }
  return new Request("http://localhost/api/decks/deck-1", init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/decks/[id]", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(jsonRequest("GET"), routeParams);

    expect(response.status).toBe(401);
    expect(mocks.getActiveDeck).not.toHaveBeenCalled();
  });

  it("returns an owned active deck", async () => {
    const user = { id: "user-1", email: "u@example.com" };
    const deck = {
      id: "deck-1",
      name: "Biology",
      description: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.getActiveDeck.mockResolvedValue(deck);

    const response = await GET(jsonRequest("GET"), routeParams);

    expect(response.status).toBe(200);
    expect(mocks.getActiveDeck).toHaveBeenCalledWith({}, user.id, deckId);
    await expect(response.json()).resolves.toEqual(deck);
  });

  it("returns 404 for missing, archived, or unowned decks", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });
    mocks.getActiveDeck.mockResolvedValue(null);

    const response = await GET(jsonRequest("GET"), routeParams);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 404 for malformed deck ids without querying", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await GET(jsonRequest("GET"), invalidRouteParams);

    expect(response.status).toBe(404);
    expect(mocks.getActiveDeck).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/decks/[id]", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await PATCH(
      jsonRequest("PATCH", { name: "New" }),
      routeParams,
    );

    expect(response.status).toBe(401);
    expect(mocks.updateDeck).not.toHaveBeenCalled();
  });

  it("updates an owned active deck", async () => {
    const user = { id: "user-1", email: "u@example.com" };
    const updated = {
      id: "deck-1",
      name: "Renamed",
      description: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-02-01T00:00:00.000Z",
    };
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.updateDeck.mockResolvedValue(updated);

    const response = await PATCH(
      jsonRequest("PATCH", { name: "Renamed" }),
      routeParams,
    );

    expect(response.status).toBe(200);
    expect(mocks.updateDeck).toHaveBeenCalledWith({}, user.id, deckId, {
      name: "Renamed",
    });
    await expect(response.json()).resolves.toEqual(updated);
  });

  it("rejects an empty update with 400", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await PATCH(jsonRequest("PATCH", {}), routeParams);

    expect(response.status).toBe(400);
    expect(mocks.updateDeck).not.toHaveBeenCalled();
  });

  it("rejects unknown fields with 400", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await PATCH(
      jsonRequest("PATCH", { archivedAt: "x" }),
      routeParams,
    );

    expect(response.status).toBe(400);
    expect(mocks.updateDeck).not.toHaveBeenCalled();
  });

  it("returns 404 when the deck is archived or unowned", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });
    mocks.updateDeck.mockResolvedValue(null);

    const response = await PATCH(
      jsonRequest("PATCH", { name: "x" }),
      routeParams,
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for malformed deck ids without querying", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await PATCH(
      jsonRequest("PATCH", { name: "x" }),
      invalidRouteParams,
    );

    expect(response.status).toBe(404);
    expect(mocks.updateDeck).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/decks/[id]", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await DELETE(jsonRequest("DELETE"), routeParams);

    expect(response.status).toBe(401);
    expect(mocks.archiveDeck).not.toHaveBeenCalled();
  });

  it("archives an owned active deck", async () => {
    const user = { id: "user-1", email: "u@example.com" };
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.archiveDeck.mockResolvedValue(true);

    const response = await DELETE(jsonRequest("DELETE"), routeParams);

    expect(response.status).toBe(200);
    expect(mocks.archiveDeck).toHaveBeenCalledWith({}, user.id, deckId);
    await expect(response.json()).resolves.toEqual({ archived: true });
  });

  it("returns 404 for archived or unowned decks", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });
    mocks.archiveDeck.mockResolvedValue(false);

    const response = await DELETE(jsonRequest("DELETE"), routeParams);

    expect(response.status).toBe(404);
  });

  it("returns 404 for malformed deck ids without querying", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await DELETE(jsonRequest("DELETE"), invalidRouteParams);

    expect(response.status).toBe(404);
    expect(mocks.archiveDeck).not.toHaveBeenCalled();
  });
});
