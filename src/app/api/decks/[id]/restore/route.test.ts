import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  restoreDeck: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  restoreDeck: mocks.restoreDeck,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { POST } from "./route";

const deckId = "550e8400-e29b-41d4-a716-446655440000";
const routeParams = { params: Promise.resolve({ id: deckId }) };
const invalidRouteParams = { params: Promise.resolve({ id: "not-a-uuid" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
});

describe("POST /api/decks/[id]/restore", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), routeParams);

    expect(response.status).toBe(401);
    expect(mocks.restoreDeck).not.toHaveBeenCalled();
  });

  it("restores an owned archived deck", async () => {
    const user = { id: "user-1" };
    mocks.getAuthenticatedUser.mockResolvedValue(user);
    mocks.restoreDeck.mockResolvedValue(true);

    const response = await POST(new Request("http://localhost"), routeParams);

    expect(response.status).toBe(200);
    expect(mocks.restoreDeck).toHaveBeenCalledWith({}, user.id, deckId);
    await expect(response.json()).resolves.toEqual({ restored: true });
  });

  it("returns 404 for active, missing, or unowned decks", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });
    mocks.restoreDeck.mockResolvedValue(false);

    const response = await POST(new Request("http://localhost"), routeParams);

    expect(response.status).toBe(404);
  });

  it("returns 404 for malformed deck ids without querying", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u" });

    const response = await POST(
      new Request("http://localhost"),
      invalidRouteParams,
    );

    expect(response.status).toBe(404);
    expect(mocks.restoreDeck).not.toHaveBeenCalled();
  });
});
