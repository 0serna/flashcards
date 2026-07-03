import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  listDueReviewCards: vi.fn(),
  listActiveStudyCards: vi.fn(),
  getDb: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/study/service", () => ({
  listDueReviewCards: mocks.listDueReviewCards,
  listActiveStudyCards: mocks.listActiveStudyCards,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { GET } from "./route";

const deckId = "550e8400-e29b-41d4-a716-446655440000";
const routeParams = {
  params: Promise.resolve({ id: deckId }),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
});

function buildRequest(url: string) {
  return new Request(url);
}

describe("GET /api/decks/[id]/study", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(
      buildRequest(`http://localhost/api/decks/${deckId}/study?mode=review`),
      routeParams,
    );

    expect(response.status).toBe(401);
    expect(mocks.listDueReviewCards).not.toHaveBeenCalled();
  });

  it("returns due review cards for review mode", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    mocks.listDueReviewCards.mockResolvedValue({
      found: true,
      cards: [{ id: "c1", deckId, front: {}, back: {} }],
    });

    const response = await GET(
      buildRequest(`http://localhost/api/decks/${deckId}/study?mode=review`),
      routeParams,
    );

    expect(response.status).toBe(200);
    expect(mocks.listDueReviewCards).toHaveBeenCalledWith({}, {}, "u1", deckId);
    await expect(response.json()).resolves.toEqual({
      mode: "review",
      cards: [{ id: "c1", deckId, front: {}, back: {} }],
    });
  });

  it("returns active cards for practice mode", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    mocks.listActiveStudyCards.mockResolvedValue({
      found: true,
      cards: [{ id: "c2", deckId }],
    });

    const response = await GET(
      buildRequest(`http://localhost/api/decks/${deckId}/study?mode=practice`),
      routeParams,
    );

    expect(response.status).toBe(200);
    expect(mocks.listActiveStudyCards).toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ mode: "practice" });
  });

  it("returns 404 when the deck is missing or unowned", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    mocks.listDueReviewCards.mockResolvedValue({ found: false });

    const response = await GET(
      buildRequest(`http://localhost/api/decks/${deckId}/study?mode=review`),
      routeParams,
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 for missing or invalid mode", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "u1" });

    const response = await GET(
      buildRequest(`http://localhost/api/decks/${deckId}/study`),
      routeParams,
    );

    expect(response.status).toBe(400);
  });
});
