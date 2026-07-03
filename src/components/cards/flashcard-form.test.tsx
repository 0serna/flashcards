import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FlashcardForm } from "./flashcard-form";

afterEach(() => {
  cleanup();
});

describe("FlashcardForm", () => {
  it("shows which save action is in progress when saving and adding another", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const alternativeAction = vi.fn();

    render(
      <FlashcardForm
        mode="create"
        action={action}
        alternativeAction={alternativeAction}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "front");
    await user.type(screen.getByRole("textbox", { name: "Back" }), "back");
    await user.click(
      screen.getByRole("button", { name: /save and add another/i }),
    );

    expect(
      screen.getByRole("button", { name: /saving and preparing another/i }),
    ).toBeInTheDocument();
  });

  it("shows inline validation when a side has no text or image", async () => {
    const user = userEvent.setup();

    render(
      <FlashcardForm
        mode="create"
        action={vi.fn()}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "sdsdsd");
    await user.click(screen.getByRole("button", { name: /save card/i }));

    const message = screen.getByText(/back needs text or an image/i);
    const buttonGroup = screen
      .getByRole("button", { name: /save card/i })
      .closest("div");

    expect(message).toBeInTheDocument();
    expect(buttonGroup?.previousElementSibling).toHaveAttribute(
      "role",
      "alert",
    );
    expect(buttonGroup?.previousElementSibling).toHaveTextContent(
      "Back needs text or an image.",
    );
  });
});
