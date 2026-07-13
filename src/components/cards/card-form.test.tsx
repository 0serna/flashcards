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
import { __resetPendingMutationsForTests } from "@/lib/navigation/pending-mutations";
import { CardForm } from "./card-form";

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
  __resetNavigationHistoryForTests();
  __resetPendingMutationsForTests();
  router.back.mockReset();
  router.replace.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  __resetDirtyFormStoreForTests();
  __resetNavigationHistoryForTests();
  __resetPendingMutationsForTests();
});

describe("CardForm", () => {
  it("shows which save action is in progress when saving and adding another", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const alternativeAction = vi.fn(() => new Promise<void>(() => undefined));

    render(
      <CardForm
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
      <CardForm
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
      <CardForm
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
      <CardForm
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
      <CardForm
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

  it("submits only the clear instruction after removing a selected replacement image", async () => {
    const revokeObjectURL = vi.fn();
    class MockUrl extends URL {
      static createObjectURL = vi.fn(() => "blob:front-preview");
      static revokeObjectURL = revokeObjectURL;
    }
    vi.stubGlobal("URL", MockUrl);
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);

    render(
      <CardForm
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

    await user.upload(
      screen.getByLabelText(/replace front image/i),
      new File(["replacement"], "replacement.png", { type: "image/png" }),
    );
    await user.click(
      screen.getByRole("button", { name: /remove front image/i }),
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:front-preview");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const submitted = action.mock.calls[0]?.[0] as FormData;
    expect(submitted.getAll("frontImage")).toEqual(["clear"]);
  });

  it("reuses one Card identity after an unconfirmed creation attempt", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection lost"))
      .mockResolvedValueOnce({
        status: "confirmed",
        value: { id: "confirmed-card" },
      });

    render(
      <CardForm
        mode="create"
        action={action}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "front");
    await user.type(screen.getByRole("textbox", { name: "Back" }), "back");
    await user.click(screen.getByRole("button", { name: /save card/i }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /save card/i }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    const first = action.mock.calls[0]?.[0] as FormData;
    const second = action.mock.calls[1]?.[0] as FormData;
    expect(first.get("intentId")).toBe(second.get("intentId"));
  });

  it("allows retrying Save and add another after a rejected outcome", async () => {
    const user = userEvent.setup();
    const alternativeAction = vi.fn().mockResolvedValue({
      status: "rejected",
      reason: "invalid",
      message: "Could not save this card.",
    });

    render(
      <CardForm
        mode="create"
        action={vi.fn()}
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
      "Could not save this card.",
    );
    expect(
      screen.getByRole("button", { name: /save and add another/i }),
    ).toBeEnabled();
  });

  it("starts a new Card identity only after Save and add another confirms", async () => {
    const user = userEvent.setup();
    const alternativeAction = vi.fn().mockResolvedValue({
      status: "confirmed",
      value: { id: "first-card", next: "new-card" },
    });

    render(
      <CardForm
        mode="create"
        action={vi.fn()}
        alternativeAction={alternativeAction}
        cancelHref="/decks/deck-1"
        submitLabel="Save card"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "one");
    await user.type(screen.getByRole("textbox", { name: "Back" }), "first");
    await user.click(
      screen.getByRole("button", { name: /save and add another/i }),
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Front" })).toHaveValue(""),
    );

    await user.type(screen.getByRole("textbox", { name: "Front" }), "two");
    await user.type(screen.getByRole("textbox", { name: "Back" }), "second");
    await user.click(
      screen.getByRole("button", { name: /save and add another/i }),
    );

    await waitFor(() => expect(alternativeAction).toHaveBeenCalledTimes(2));
    const first = alternativeAction.mock.calls[0]?.[0] as FormData;
    const second = alternativeAction.mock.calls[1]?.[0] as FormData;
    expect(first.get("intentId")).not.toBe(second.get("intentId"));
  });

  it("shows inline validation when a side has no text or image", async () => {
    const user = userEvent.setup();

    render(
      <CardForm
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

  it("archives without requiring front or back content", async () => {
    const user = userEvent.setup();
    const archiveAction = vi.fn().mockResolvedValue(undefined);

    render(
      <CardForm
        mode="edit"
        action={vi.fn()}
        archiveAction={archiveAction}
        cancelHref="/decks/deck-1"
        submitLabel="Save changes"
      />,
    );

    await user.click(screen.getByRole("button", { name: /^archive$/i }));

    await waitFor(() => expect(archiveAction).toHaveBeenCalledOnce());
    expect(
      screen.queryByText(/front needs text or an image/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/back needs text or an image/i),
    ).not.toBeInTheDocument();
  });

  it("does not prompt on Cancel when the form is clean", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <CardForm
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
      <CardForm
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
