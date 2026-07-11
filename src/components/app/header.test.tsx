import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "./header";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Header", () => {
  beforeEach(() => {
    // window.confirm is jsdom-undefined; stub so GuardedLink can call it.
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("links the home logo to / and renders the account menu", () => {
    render(<Header signOutAction={vi.fn()} />);

    const homeLink = screen.getByRole("link", { name: /flashcards home/i });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("button", { name: /account menu/i }),
    ).toBeInTheDocument();
  });

  it("opens the account menu and exposes sign out", async () => {
    const user = userEvent.setup();
    render(<Header signOutAction={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /account menu/i }));

    expect(
      screen.getByRole("group", { name: /account actions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });
});
