import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __resetDirtyFormStoreForTests,
  markFormDirty,
} from "./dirty-form-store";
import { Breadcrumb } from "./breadcrumb";

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
  vi.restoreAllMocks();
});

describe("Breadcrumb", () => {
  it("renders semantic nav with the full path on wider viewports", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Spanish Basics", href: "/decks/abc" },
          { label: "Edit card" },
        ]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();

    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveAttribute("href", "/");

    const deck = screen.getByRole("link", { name: "Spanish Basics" });
    expect(deck).toHaveAttribute("href", "/decks/abc");

    const current = screen.getByText("Edit card");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("hides the Home link on narrow viewports", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Spanish Basics", href: "/decks/abc" },
          { label: "Edit card" },
        ]}
      />,
    );

    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveClass("hidden");
  });

  it("marks the immediate parent with the mobile back-arrow affordance", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Spanish Basics", href: "/decks/abc" },
          { label: "Edit card" },
        ]}
      />,
    );

    const deckLink = screen.getByRole("link", { name: "Spanish Basics" });
    expect(deckLink.querySelector("svg")).not.toBeNull();
  });

  it("renders only parent + current for a two-item chain (Deck detail)", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Spanish Basics" }]}
      />,
    );

    // In a two-item chain the Home link is the immediate parent and stays
    // visible on mobile so the user can return home.
    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveAttribute("href", "/");

    const current = screen.getByText("Spanish Basics");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("guards an ancestor navigation when the form is dirty", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Spanish Basics", href: "/decks/abc" },
          { label: "Edit card" },
        ]}
      />,
    );
    markFormDirty();

    await user.click(screen.getByRole("link", { name: "Spanish Basics" }));

    expect(confirm).toHaveBeenCalledOnce();
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("truncates a long Deck name without losing the accessible label", () => {
    const longName = "Advanced Spanish Vocabulary With Very Many Words";
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: longName, href: "/decks/abc" },
          { label: "Review" },
        ]}
      />,
    );

    const deckLink = screen.getByRole("link", { name: longName });
    expect(deckLink).toHaveAttribute("href", "/decks/abc");
    expect(deckLink).toHaveTextContent(longName);
  });
});
