import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  getDb: vi.fn(),
  createClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  updateDeck: vi.fn(),
  archiveDeck: vi.fn(),
  createDeck: vi.fn(),
  restoreDeck: vi.fn(),
}));

vi.mock("next/navigation", () => ({
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
  archiveDeck: mocks.archiveDeck,
  createDeck: mocks.createDeck,
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  restoreDeck: mocks.restoreDeck,
  updateDeck: mocks.updateDeck,
}));

import { createDeckAction, updateDeckAction } from "./actions";

const deckId = "11111111-1111-4111-8111-111111111111";

describe("deck actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mocks.getDb.mockReturnValue({});
    mocks.createClient.mockResolvedValue({});
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.updateDeck.mockResolvedValue({
      status: "updated",
      deck: { id: deckId },
    });
  });

  it("creates a Deck with the caller-preassigned identity without redirecting", async () => {
    mocks.createDeck.mockResolvedValue({ id: deckId });
    const formData = new FormData();
    formData.set("intentId", deckId);
    formData.set("name", "Spanish Basics");
    formData.set("description", "Words");

    const result = await createDeckAction(formData);

    expect(mocks.createDeck).toHaveBeenCalledWith(expect.anything(), "user-1", {
      id: deckId,
      name: "Spanish Basics",
      description: "Words",
    });
    expect(result).toEqual({ status: "confirmed", value: { id: deckId } });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a stale Deck edit explicitly", async () => {
    mocks.updateDeck.mockResolvedValue({
      status: "stale",
      deck: { id: deckId },
    });
    const formData = new FormData();
    formData.set("name", "Spanish Basics");
    formData.set("description", "Updated description");
    formData.set("expectedUpdatedAt", "2024-01-01T00:00:00.000Z");

    await expect(updateDeckAction(deckId, formData)).resolves.toMatchObject({
      status: "rejected",
      reason: "stale",
    });
  });

  it("saves the deck without redirecting (navigation handled by client)", async () => {
    const formData = new FormData();
    formData.set("name", "Spanish Basics");
    formData.set("description", "Updated description");
    formData.set("expectedUpdatedAt", "2024-01-01T00:00:00.000Z");

    const result = await updateDeckAction(deckId, formData);

    expect(result).toEqual({ status: "confirmed", value: { id: deckId } });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.updateDeck).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/decks/${deckId}`);
  });
});
