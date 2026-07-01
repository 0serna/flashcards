import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("shows a useful signed-in study starting point", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /ready for a quiet study session/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /your review queue will appear here when cards are ready/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /start by adding decks when deck creation is available/i,
      ),
    ).toBeInTheDocument();
  });
});
