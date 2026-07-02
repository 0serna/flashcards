import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Logo } from "./logo";

afterEach(cleanup);

describe("Logo", () => {
  it("renders Flashcards as an accessible home link by default", () => {
    render(<Logo />);

    const logo = screen.getByRole("link", { name: "Flashcards" });

    expect(logo).toHaveAttribute("href", "/");
    expect(logo).toHaveClass("min-h-11");
  });

  it("can render the Stack Recall mark without the wordmark", () => {
    render(<Logo showWordmark={false} label="Flashcards home" />);

    const logo = screen.getByRole("link", { name: "Flashcards home" });
    expect(logo).toHaveAttribute("href", "/");
    expect(within(logo).queryByText("Flashcards")).not.toBeInTheDocument();
  });
});
