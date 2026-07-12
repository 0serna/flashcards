import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  getActiveDeck: vi.fn(),
  listActiveCards: vi.fn(),
  listArchivedCards: vi.fn(),
  countActiveCards: vi.fn(),
  countDueReviewCards: vi.fn(),
  getActiveCard: vi.fn(),
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

vi.mock("@/lib/cards/service", () => ({
  listActiveCards: mocks.listActiveCards,
  listArchivedCards: mocks.listArchivedCards,
  countActiveCards: mocks.countActiveCards,
  getActiveCard: mocks.getActiveCard,
}));

vi.mock("@/lib/study/service", () => ({
  countDueReviewCards: mocks.countDueReviewCards,
}));

import NewDeckPage from "./new/page";
import AddFirstCardPage from "./[deckId]/cards/new/page";
import DeckDetailPage from "./[deckId]/page";
import EditDeckPage from "./[deckId]/edit/page";
import EditCardPage from "./[deckId]/cards/[cardId]/edit/page";
import ArchivedCardsPage from "./[deckId]/cards/archived/page";

const deckId = "123e4567-e89b-12d3-a456-426614174000";
const cardId = "550e8400-e29b-41d4-a716-446655440000";

const deck = {
  id: deckId,
  name: "Spanish Basics",
  description: "Everyday words and short phrases.",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const card = {
  id: cardId,
  deckId,
  front: { text: "Hola", imagePath: null, imageUrl: null },
  back: { text: "Hello", imagePath: null, imageUrl: null },
  createdAt: "2024-02-01T00:00:00.000Z",
  updatedAt: "2024-02-01T00:00:00.000Z",
};

const cardWithImages = {
  ...card,
  front: {
    text: "Hola",
    imagePath: `${deckId}/${cardId}/front/image.webp`,
    imageUrl: "https://example.com/front.webp",
  },
  back: {
    text: "Hello",
    imagePath: `${deckId}/${cardId}/back/image.webp`,
    imageUrl: "https://example.com/back.webp",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.getActiveDeck.mockResolvedValue(deck);
  mocks.listActiveCards.mockResolvedValue([]);
  mocks.listArchivedCards.mockResolvedValue([]);
  mocks.countActiveCards.mockResolvedValue(0);
  mocks.countDueReviewCards.mockResolvedValue(0);
  mocks.getActiveCard.mockResolvedValue(card);
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

  it("renders each flashcard as a clickable row that opens the edit view", async () => {
    mocks.listActiveCards.mockResolvedValue([card]);
    mocks.countActiveCards.mockResolvedValue(1);

    render(await DeckDetailPage({ params: Promise.resolve({ deckId }) }));

    expect(mocks.listActiveCards).toHaveBeenCalled();
    expect(mocks.countActiveCards).toHaveBeenCalled();
    expect(screen.getByText("1 card")).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /more card actions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: /card actions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /archive card/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hola.*hello/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/cards/${cardId}/edit`,
    );
  });

  it("marks compact front and back previews when a flashcard side has an image", async () => {
    mocks.listActiveCards.mockResolvedValue([cardWithImages]);
    mocks.countActiveCards.mockResolvedValue(1);

    render(await DeckDetailPage({ params: Promise.resolve({ deckId }) }));

    expect(screen.getByLabelText(/front has image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/back has image/i)).toBeInTheDocument();
  });

  it("keeps secondary deck actions in the title menu and surfaces add-card as the primary action", async () => {
    const user = userEvent.setup();
    mocks.countActiveCards.mockResolvedValue(1);
    render(await DeckDetailPage({ params: Promise.resolve({ deckId }) }));

    expect(screen.getByRole("link", { name: /^add card$/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/cards/new`,
    );
    expect(
      screen.getByRole("link", { name: /practice random/i }),
    ).toHaveAttribute("href", `/decks/${deckId}/study?mode=practice`);
    expect(
      screen.queryByRole("link", { name: /edit deck/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view archived cards/i }),
    ).not.toBeInTheDocument();
    // Shared header + deck-detail breadcrumb (Home / Spanish Basics).
    expect(
      screen.getByRole("link", { name: /flashcards home/i }),
    ).toHaveAttribute("href", "/");
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(breadcrumb).getByText("Spanish Basics")).toHaveAttribute(
      "aria-current",
      "page",
    );

    const actionsButton = screen.getByRole("button", {
      name: /more deck actions/i,
    });
    await user.click(actionsButton);

    expect(actionsButton).toHaveAttribute("aria-haspopup", "menu");
    expect(actionsButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("group", { name: /deck actions/i }),
    ).toHaveAttribute("id", `deck-actions-${deckId}`);
    expect(screen.getByRole("link", { name: /edit deck/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/edit`,
    );
    expect(
      screen.getByRole("link", { name: /view archived cards/i }),
    ).toHaveAttribute("href", `/decks/${deckId}/cards/archived`);
    expect(
      screen.getByRole("button", { name: /archive deck/i }),
    ).toBeInTheDocument();
  });

  it("surfaces study-due as the primary action when there are due flashcards", async () => {
    mocks.countActiveCards.mockResolvedValue(5);
    mocks.countDueReviewCards.mockResolvedValue(3);

    render(await DeckDetailPage({ params: Promise.resolve({ deckId }) }));

    expect(screen.getByText(/3 due now/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /study due/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}/study?mode=review`,
    );
    expect(
      screen.getByRole("link", { name: /practice random/i }),
    ).toHaveAttribute("href", `/decks/${deckId}/study?mode=practice`);
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
    // Edit deck is reached via Home / [Deck] / Edit deck.
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(breadcrumb).getByText("Edit deck")).toHaveAttribute(
      "aria-current",
      "page",
    );
    const deckLink = within(breadcrumb).getByRole("link", {
      name: "Spanish Basics",
    });
    expect(deckLink).toHaveAttribute("href", `/decks/${deckId}`);
  });

  it("uses the real deck name when creating a card and offers save and save-and-add-another", async () => {
    render(await AddFirstCardPage({ params: Promise.resolve({ deckId }) }));

    expect(mocks.getActiveDeck).toHaveBeenCalledWith({}, "user-1", deckId);
    expect(
      screen.getByRole("heading", { name: /add the first card/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Front")).toBeInTheDocument();
    expect(screen.getByLabelText("Back")).toBeInTheDocument();
    expect(screen.queryByText(/mocked for now/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^save card$/i }),
    ).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("button", { name: /save and add another/i }),
    ).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      `/decks/${deckId}`,
    );
    // Add card breadcrumb: Home / [Deck] / Add card.
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(breadcrumb).getByText("Add card")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(breadcrumb).getByRole("link", { name: "Spanish Basics" }),
    ).toHaveAttribute("href", `/decks/${deckId}`);
  });

  it("preloads card text when editing a card and exposes the archive action", async () => {
    render(
      await EditCardPage({
        params: Promise.resolve({ deckId, cardId }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: /edit card/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hola")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive card/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/active card/i)).toBeInTheDocument();
    expect(screen.queryByText(/stays archived/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mocked for now/i)).not.toBeInTheDocument();
    // Edit card breadcrumb: Home / [Deck] / Edit card.
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(breadcrumb).getByText("Edit card")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("lists archived cards with restore actions", async () => {
    mocks.listArchivedCards.mockResolvedValue([card]);
    render(
      await ArchivedCardsPage({
        params: Promise.resolve({ deckId }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: /archived cards/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restore card/i }),
    ).toBeInTheDocument();
    // Archived cards breadcrumb: Home / [Deck] / Archived cards.
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(breadcrumb).getByText("Archived cards")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("explains when a deck has no archived cards", async () => {
    render(
      await ArchivedCardsPage({
        params: Promise.resolve({ deckId }),
      }),
    );

    expect(screen.getByText(/no archived cards/i)).toBeInTheDocument();
  });
});
