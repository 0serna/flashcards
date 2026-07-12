import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  listActiveDecks: vi.fn(),
  hasArchivedDecks: vi.fn(),
  countActiveCards: vi.fn(),
  countDueReviewCards: vi.fn(),
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
    listActiveDecks: mocks.listActiveDecks,
    hasArchivedDecks: mocks.hasArchivedDecks,
  };
});

vi.mock("@/lib/cards/service", () => ({
  countActiveCards: mocks.countActiveCards,
}));

vi.mock("@/lib/study/service", () => ({
  countDueReviewCards: mocks.countDueReviewCards,
}));

import Home from "./page";

const deckId = "123e4567-e89b-12d3-a456-426614174000";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.hasArchivedDecks.mockResolvedValue(false);
  mocks.countActiveCards.mockResolvedValue(0);
  mocks.countDueReviewCards.mockResolvedValue(0);
  mocks.listActiveDecks.mockResolvedValue([
    {
      id: deckId,
      name: "Spanish Basics",
      description: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ]);
});

afterEach(() => {
  cleanup();
});

describe("Home", () => {
  it("shows active decks from the backend with mocked card status", async () => {
    const user = userEvent.setup();
    const { container } = render(await Home());

    expect(container.firstElementChild).toHaveClass("bg-secondary/30");
    expect(mocks.listActiveDecks).toHaveBeenCalledWith({}, "user-1");
    expect(mocks.hasArchivedDecks).toHaveBeenCalledWith({}, "user-1");
    expect(screen.getByRole("link", { name: /create deck/i })).toHaveAttribute(
      "href",
      "/decks/new",
    );
    expect(
      screen.getByRole("link", { name: /spanish basics/i }),
    ).toHaveAttribute("href", `/decks/${deckId}`);
    expect(screen.getByText(/0 cards/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /study due cards/i }),
    ).not.toBeInTheDocument();
    // Shared authenticated header: home logo and account menu.
    expect(
      screen.getByRole("link", { name: /flashcards home/i }),
    ).toHaveAttribute("href", "/");
    // Home does not render a redundant breadcrumb.
    expect(
      screen.queryByRole("navigation", { name: /breadcrumb/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /account menu/i }));
    expect(
      screen.getByRole("group", { name: /account actions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /archived decks/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a discreet archived decks link when archived decks exist", async () => {
    mocks.hasArchivedDecks.mockResolvedValue(true);

    render(await Home());

    expect(
      screen.getByRole("link", { name: /archived decks/i }),
    ).toHaveAttribute("href", "/decks/archived");
  });
});
