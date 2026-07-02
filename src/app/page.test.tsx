import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  listActiveDecks: vi.fn(),
  hasArchivedDecks: vi.fn(),
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

import Home from "./page";

const deckId = "123e4567-e89b-12d3-a456-426614174000";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.hasArchivedDecks.mockResolvedValue(false);
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

describe("Home", () => {
  it("shows active decks from the backend with mocked card status", async () => {
    const { container } = render(await Home());

    expect(container.firstElementChild).toHaveClass("bg-secondary/30");
    expect(mocks.listActiveDecks).toHaveBeenCalledWith({}, "user-1");
    expect(mocks.hasArchivedDecks).toHaveBeenCalledWith({}, "user-1");
    expect(
      screen.getByRole("heading", { name: /what do you want to study today/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create a new deck/i }),
    ).toHaveAttribute("href", "/decks/new");
    expect(
      screen.getByRole("link", { name: /spanish basics/i }),
    ).toHaveAttribute("href", `/decks/${deckId}`);
    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /study due cards/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /account settings/i }),
    ).toHaveAttribute("href", "/account");
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
