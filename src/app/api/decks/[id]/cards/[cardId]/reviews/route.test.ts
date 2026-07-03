import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  recordCardReview: vi.fn(),
  getDb: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/study/service", () => ({
  recordCardReview: mocks.recordCardReview,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { POST } from "./route";

const deckId = "550e8400-e29b-41d4-a716-446655440000";
const cardId = "660e8400-e29b-41d4-a716-446655440000";
const routeParams = {
  params: Promise.resolve({ id: deckId, cardId }),
};

function jsonRequest(body: unknown) {
  return new Request(
    `http://localhost/api/decks/${deckId}/cards/${cardId}/reviews`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
});

describe("POST /api/decks/[id]/cards/[cardId]/reviews", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      jsonRequest({ rating: "remembered" }),
      routeParams,
    );

    expect(response.status).toBe(401);
    expect(mocks.recordCardReview).not.toHaveBeenCalled();
  });

  it("persists a valid rating", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    mocks.recordCardReview.mockResolvedValue({
      found: true,
      rating: "remembered",
      reviewedAt: "2024-01-01T00:00:00.000Z",
      scheduledMinutes: 4320,
      nextDueAt: "2024-01-04T00:00:00.000Z",
    });

    const response = await POST(
      jsonRequest({ rating: "remembered" }),
      routeParams,
    );

    expect(response.status).toBe(201);
    expect(mocks.recordCardReview).toHaveBeenCalledWith(
      {},
      "u1",
      deckId,
      cardId,
      "remembered",
    );
  });

  it("returns 400 for unknown ratings", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });

    const response = await POST(jsonRequest({ rating: "easy" }), routeParams);

    expect(response.status).toBe(400);
    expect(mocks.recordCardReview).not.toHaveBeenCalled();
  });

  it("returns 404 when the card is missing or archived", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    mocks.recordCardReview.mockResolvedValue({ found: false });

    const response = await POST(
      jsonRequest({ rating: "partial" }),
      routeParams,
    );

    expect(response.status).toBe(404);
  });
});
