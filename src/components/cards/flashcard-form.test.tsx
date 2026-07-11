import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

import { __resetDirtyFormStoreForTests } from "@/components/app/dirty-form-store";
import { __resetNavigationHistoryForTests } from "@/components/app/navigation-history-store";
import { FlashcardForm } from "./flashcard-form";

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
  __resetNavigationHistoryForTests();
  router.back.mockReset();
  router.replace.mockReset();
  vi.restoreAllMocks();
});

beforeEach(() => {
  __resetDirtyFormStoreForTests();
  __resetNavigationHistoryForTests();
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

  it("replaces to the parent after a direct edit entry", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);

    render(
      <FlashcardForm
        mode="edit"
        action={action}
        cancelHref="/decks/deck-1"
        submitLabel="Save changes"
        initial={{
          front: { text: "Question", imageUrl: null },
          back: { text: "Answer", imageUrl: null },
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/decks/deck-1"),
    );
    expect(router.back).not.toHaveBeenCalled();
  });

  it("shows an inline error when an edit save fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockRejectedValue(new Error("network failure"));

    render(
      <FlashcardForm
        mode="edit"
        action={action}
        cancelHref="/decks/deck-1"
        submitLabel="Save changes"
        initial={{
          front: { text: "Question", imageUrl: null },
          back: { text: "Answer", imageUrl: null },
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save the card. Try again.",
    );
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows an inline error when card creation fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockRejectedValue(new Error("network failure"));

    render(
      <FlashcardForm
        mode="create"
        action={action}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "front");
    await user.type(screen.getByRole("textbox", { name: "Back" }), "back");
    await user.click(screen.getByRole("button", { name: /save card/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not create the card. Try again.",
    );
  });

  it("shows an inline error when save-and-add-another fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const alternativeAction = vi.fn().mockRejectedValue(new Error("fail"));

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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not create the card. Try again.",
    );
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

  it("does not prompt on Cancel when the form is clean", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <FlashcardForm
        mode="create"
        action={vi.fn()}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.click(screen.getByRole("link", { name: /cancel/i }));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("prompts on Cancel when the user has typed into a side", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <FlashcardForm
        mode="create"
        action={vi.fn()}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "Question");
    await user.type(screen.getByRole("textbox", { name: "Back" }), "Answer");

    await user.click(screen.getByRole("link", { name: /cancel/i }));
    expect(confirm).toHaveBeenCalled();
  });
});
