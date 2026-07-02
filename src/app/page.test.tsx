import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("shows the signed-in user a mobile-first deck starting point", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /what do you want to study today/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create a new deck/i }),
    ).toHaveAttribute("href", "/decks/new");
    expect(
      screen.getByRole("link", { name: /spanish basics/i }),
    ).toHaveAttribute("href", "/decks/spanish-basics");
    expect(screen.getByText(/12 cards due/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /study due cards/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /account settings/i }),
    ).toHaveAttribute("href", "/account");
  });
});
