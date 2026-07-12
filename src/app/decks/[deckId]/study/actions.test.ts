import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getDb: vi.fn(),
  createClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  recordCardReview: vi.fn(),
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
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/study/service", () => ({
  recordCardReview: mocks.recordCardReview,
}));

import { submitRatingAction } from "./actions";

const deckId = "11111111-1111-4111-8111-111111111111";
const cardId = "22222222-2222-4222-8222-222222222222";

describe("study actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({});
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.recordCardReview.mockResolvedValue({ found: true });
  });

  it("updates the deck without refreshing the active study queue", async () => {
    await expect(
      submitRatingAction(deckId, cardId, "remembered"),
    ).resolves.toEqual({ ok: true });

    expect(mocks.revalidatePath).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/decks/${deckId}`);
  });
});
