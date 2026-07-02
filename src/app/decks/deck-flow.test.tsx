import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  getActiveDeck: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/decks/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/decks/service")>();
  return {
    ...actual,
    getAuthenticatedUser: mocks.getAuthenticatedUser,
    getActiveDeck: mocks.getActiveDeck,
  };
});

import NewDeckPage from "./new/page";
import AddFirstCardPage from "./[deckId]/cards/new/page";
import DeckDetailPage from "./[deckId]/page";
import EditDeckPage from "./[deckId]/edit/page";

const deckId = "123e4567-e89b-12d3-a456-426614174000";
const deck = {
  id: deckId,
  name: "Spanish Basics",
  description: "Everyday words and short phrases.",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.getActiveDeck.mockResolvedValue(deck);
});

afterEach(() => {
  cleanup();
});

describe("deck management flow", () => {
  it("starts deck creation with a shared deck form and no extra next-step hint", () => {
    render(<NewDeckPage />);

    expect(
      screen.getByRole("heading", { name: /create deck/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/deck name/i)).toBeRequired();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create deck/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/next: add the first card/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/you can add cards after creating it/i),
    ).not.toBeInTheDocument();
  });

  it("loads deck detail from the deck backend and keeps management in a dismissible title menu", async () => {
    const user = userEvent.setup();
    render(await DeckDetailPage({ params: Promise.resolve({ deckId }) }));

    expect(mocks.getActiveDeck).toHaveBeenCalledWith({}, "user-1", deckId);
    expect(
      screen.getByRole("heading", { name: /spanish basics/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /study now/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/study`,
    );
    expect(screen.getByRole("link", { name: /add card/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/cards/new`,
    );
    expect(
      screen.queryByRole("link", { name: /edit deck/i }),
    ).not.toBeInTheDocument();

    const actionsButton = screen.getByRole("button", {
      name: /more deck actions/i,
    });
    await user.click(actionsButton);

    expect(actionsButton).toHaveAttribute("aria-haspopup", "menu");
    expect(actionsButton).toHaveAttribute("aria-expanded", "true");
    expect(actionsButton).toHaveAttribute(
      "aria-controls",
      `deck-actions-${deckId}`,
    );
    expect(
      screen.getByRole("group", { name: /deck actions/i }),
    ).toHaveAttribute("id", `deck-actions-${deckId}`);
    expect(screen.getByRole("link", { name: /edit deck/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/edit`,
    );
    expect(
      screen.getByRole("button", { name: /archive deck/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/cards and progress are kept/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("heading", { name: /spanish basics/i }));

    expect(
      screen.queryByRole("link", { name: /edit deck/i }),
    ).not.toBeInTheDocument();
  });

  it("edits a deck loaded from the backend with the same form vocabulary", async () => {
    render(await EditDeckPage({ params: Promise.resolve({ deckId }) }));

    expect(mocks.getActiveDeck).toHaveBeenCalledWith({}, "user-1", deckId);
    expect(
      screen.getByRole("heading", { name: /edit deck/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Spanish Basics")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}`,
    );
    expect(
      screen.queryByRole("button", { name: /archive deck/i }),
    ).not.toBeInTheDocument();
  });

  it("uses the real deck name when adding the first mocked card", async () => {
    render(await AddFirstCardPage({ params: Promise.resolve({ deckId }) }));

    expect(mocks.getActiveDeck).toHaveBeenCalledWith({}, "user-1", deckId);
    expect(
      screen.getByRole("heading", { name: /add the first card/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /spanish basics/i }),
    ).toHaveAttribute("href", `/decks/${deckId}`);
    expect(screen.getByLabelText(/front/i)).toBeRequired();
    expect(screen.getByLabelText(/back/i)).toBeRequired();
    expect(screen.queryByText(/mocked for now/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^save card$/i }),
    ).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("button", { name: /save and create another/i }),
    ).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: /skip for now/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}`,
    );
  });
});
