import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  revalidatePath: vi.fn(),
  getDb: vi.fn(),
  createClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  updateCard: vi.fn(),
  archiveCard: vi.fn(),
  createCard: vi.fn(),
  restoreCard: vi.fn(),
  parseCreateImage: vi.fn(),
  parseText: vi.fn(),
  parseUpdateImage: vi.fn(),
  getActiveDeck: vi.fn(),
  getActiveCard: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/decks/service", () => ({
  getActiveDeck: mocks.getActiveDeck,
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/cards/service", () => ({
  archiveCard: mocks.archiveCard,
  createCard: mocks.createCard,
  getActiveCard: mocks.getActiveCard,
  restoreCard: mocks.restoreCard,
  updateCard: mocks.updateCard,
}));

vi.mock("@/lib/api/multipart", () => ({
  parseCreateImage: mocks.parseCreateImage,
  parseText: mocks.parseText,
  parseUpdateImage: mocks.parseUpdateImage,
}));

import { createCardAction, updateCardAction } from "./actions";

const deckId = "11111111-1111-4111-8111-111111111111";
const cardId = "22222222-2222-4222-8222-222222222222";

describe("card actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mocks.getDb.mockReturnValue({});
    mocks.createClient.mockResolvedValue({});
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.parseText.mockImplementation(async (_formData, field) =>
      field === "frontText" ? "Updated front" : "Updated back",
    );
    mocks.parseUpdateImage.mockResolvedValue(null);
    mocks.updateCard.mockResolvedValue({ id: cardId });
  });

  it("creates a Card with the caller-preassigned identity", async () => {
    mocks.getActiveDeck.mockResolvedValue({ id: deckId });
    mocks.parseCreateImage.mockResolvedValue(null);
    mocks.parseText.mockImplementation(async (_formData, field) =>
      field === "frontText" ? "Front" : "Back",
    );
    mocks.createCard.mockResolvedValue({ id: cardId });
    const formData = new FormData();
    formData.set("intentId", cardId);

    const result = await createCardAction(deckId, "new-card", formData);

    expect(mocks.createCard).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user-1",
      deckId,
      expect.objectContaining({ id: cardId }),
    );
    expect(result).toEqual({
      status: "confirmed",
      value: { id: cardId, next: "new-card" },
    });
  });

  it("returns an explicit stale rejection for an outdated Card edit", async () => {
    mocks.updateCard.mockResolvedValue(null);
    mocks.getActiveCard.mockResolvedValue({ id: cardId });
    const formData = new FormData();
    formData.set("frontText", "Updated front");
    formData.set("backText", "Updated back");
    formData.set("expectedUpdatedAt", "2024-01-01T00:00:00.000Z");

    await expect(
      updateCardAction(deckId, cardId, formData),
    ).resolves.toMatchObject({
      status: "rejected",
      reason: "stale",
    });
  });

  it("saves the card without redirecting (navigation handled by client)", async () => {
    const formData = new FormData();
    formData.set("frontText", "Updated front");
    formData.set("backText", "Updated back");
    formData.set("expectedUpdatedAt", "2024-01-01T00:00:00.000Z");

    const result = await updateCardAction(deckId, cardId, formData);

    expect(result).toEqual({ status: "confirmed", value: { id: cardId } });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.updateCard).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/decks/${deckId}`);
  });
});
