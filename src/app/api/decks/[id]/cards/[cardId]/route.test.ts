import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class CardContentError extends Error {}
  return {
    CardContentError,
    getAuthenticatedUser: vi.fn(),
    getActiveCard: vi.fn(),
    updateCard: vi.fn(),
    archiveCard: vi.fn(),
    getDb: vi.fn(),
  };
});

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/cards/service", () => ({
  CardContentError: mocks.CardContentError,
  getActiveCard: mocks.getActiveCard,
  updateCard: mocks.updateCard,
  archiveCard: mocks.archiveCard,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

import { PATCH } from "./route";

const deckId = "123e4567-e89b-42d3-a456-426614174000";
const cardId = "550e8400-e29b-41d4-a716-446655440000";
const routeParams = { params: Promise.resolve({ id: deckId, cardId }) };

function multipartRequest(formData: FormData) {
  return new Request(`http://localhost/api/decks/${deckId}/cards/${cardId}`, {
    method: "PATCH",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
});

describe("PATCH /api/decks/[id]/cards/[cardId]", () => {
  it("returns 400 when an update would leave a side empty", async () => {
    const formData = new FormData();
    formData.append("frontText", "");
    mocks.updateCard.mockRejectedValue(
      new mocks.CardContentError("Front must include text or an image"),
    );

    const response = await PATCH(multipartRequest(formData), routeParams);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Front must include text or an image",
    });
  });
});
