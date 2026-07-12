import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  listArchivedDecks: vi.fn(),
  countActiveCards: vi.fn(),
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
    listArchivedDecks: mocks.listArchivedDecks,
  };
});

vi.mock("@/lib/cards/service", () => ({
  countActiveCards: mocks.countActiveCards,
}));

import ArchivedDecksPage from "./page";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.countActiveCards.mockResolvedValue(2);
  mocks.listArchivedDecks.mockResolvedValue([
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Biology Terms",
      description: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ]);
});

describe("ArchivedDecksPage", () => {
  it("lists archived decks and offers restore", async () => {
    render(await ArchivedDecksPage());

    expect(mocks.listArchivedDecks).toHaveBeenCalledWith({}, "user-1");
    expect(
      screen.queryByRole("heading", { name: /archived decks/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Biology Terms")).toBeInTheDocument();
    expect(screen.getByText(/2 cards/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restore biology terms/i }),
    ).toBeInTheDocument();
    // Shared header and contextual navigation.
    expect(
      screen.getByRole("link", { name: /flashcards home/i }),
    ).toHaveAttribute("href", "/");
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(breadcrumb).toBeInTheDocument();
    expect(
      within(breadcrumb).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("href", "/");
    expect(within(breadcrumb).getByText("Archived decks")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("explains when there are no archived decks", async () => {
    mocks.listArchivedDecks.mockResolvedValue([]);

    render(await ArchivedDecksPage());

    expect(screen.getByText(/no archived decks/i)).toBeInTheDocument();
  });
});
