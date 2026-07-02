import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  listArchivedDecks: vi.fn(),
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

import ArchivedDecksPage from "./page";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({});
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
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
      screen.getByRole("heading", { name: /archived decks/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Biology Terms")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restore biology terms/i }),
    ).toBeInTheDocument();
  });

  it("explains when there are no archived decks", async () => {
    mocks.listArchivedDecks.mockResolvedValue([]);

    render(await ArchivedDecksPage());

    expect(screen.getByText(/no archived decks/i)).toBeInTheDocument();
  });
});
