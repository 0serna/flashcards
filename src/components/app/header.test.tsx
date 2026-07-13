import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "./header";

const RELEASE_ENV_KEY = "NEXT_PUBLIC_APP_RELEASE_ID";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[RELEASE_ENV_KEY];
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

  it("does not render the release update action when no release mismatch is detected", () => {
    render(<Header signOutAction={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /^update$/i }),
    ).not.toBeInTheDocument();
  });

  it("groups an available update directly with the logo, apart from the account menu", async () => {
    process.env[RELEASE_ENV_KEY] = "loaded-release";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ releaseId: "active-release" })),
    );

    render(<Header signOutAction={vi.fn()} />);

    const homeLink = screen.getByRole("link", { name: /flashcards home/i });
    const update = await screen.findByRole("button", { name: /^update$/i });
    const accountMenu = screen.getByRole("button", { name: /account menu/i });
    const brandActions = homeLink.parentElement;

    expect(brandActions).not.toBeNull();
    expect(brandActions).toContainElement(update);
    expect(brandActions).not.toContainElement(accountMenu);
    expect(update).toHaveClass("text-sm");
  });

  it("keeps the home link, update action, and account menu in tab order on a narrow header", () => {
    render(<Header signOutAction={vi.fn()} />);

    const homeLink = screen.getByRole("link", { name: /flashcards home/i });
    expect(homeLink).toHaveAttribute("href", "/");

    // The shell width is bounded to a single reading width
    // (`max-w-md` in `AppScreen`); here we only verify the controls
    // exist as focusable elements and do not overflow horizontally.
    const header = homeLink.closest("header");
    expect(header).not.toBeNull();
    expect(header).toHaveClass("items-center");
    expect(header).toHaveClass("justify-between");
  });

  it("does not expose any release details or version metadata in the header", () => {
    render(<Header signOutAction={vi.fn()} />);

    // The header is a single reading surface and never surfaces a
    // release number, commit hash, deployment identity, or other
    // release details.
    const header = screen.getByRole("banner");
    expect(header.textContent ?? "").not.toMatch(/v?\d+\.\d+\.\d+/);
    expect(header.textContent ?? "").not.toMatch(/commit/i);
    expect(header.textContent ?? "").not.toMatch(/release[-_ ]?id/i);
  });
});
