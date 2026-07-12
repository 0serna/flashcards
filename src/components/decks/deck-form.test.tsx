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
import {
  __resetNavigationHistoryForTests,
  recordAppPath,
} from "@/components/app/navigation-history-store";
import { DeckForm, DeckFormShell } from "./deck-form";

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
});

describe("DeckForm dirty-form behavior", () => {
  it("does not prompt for confirmation on a clean Cancel", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <DeckFormShell
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Create deck" },
        ]}
      >
        <DeckForm mode="create" action={vi.fn()} />
      </DeckFormShell>,
    );

    await user.click(screen.getByRole("link", { name: /cancel/i }));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("uses browser back after an edit reached from its parent", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);
    __resetNavigationHistoryForTests();
    recordAppPath("/decks/abc");
    recordAppPath("/decks/abc/edit");

    render(
      <DeckForm
        mode="edit"
        action={action}
        deck={{ id: "abc", name: "Spanish Basics", description: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(router.back).toHaveBeenCalledOnce());
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("replaces to the parent after a direct edit entry", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);

    render(
      <DeckForm
        mode="edit"
        action={action}
        deck={{ id: "abc", name: "Spanish Basics", description: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/decks/abc"),
    );
    expect(router.back).not.toHaveBeenCalled();
  });

  it("shows an inline error when an edit save fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockRejectedValue(new Error("network failure"));

    render(
      <DeckForm
        mode="edit"
        action={action}
        deck={{ id: "abc", name: "Spanish Basics", description: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save the deck. Try again.",
    );
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows an inline error when creation fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockRejectedValue(new Error("network failure"));

    render(
      <DeckFormShell
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Create deck" },
        ]}
      >
        <DeckForm mode="create" action={action} />
      </DeckFormShell>,
    );

    await user.type(screen.getByLabelText(/deck name/i), "My Deck");
    await user.click(screen.getByRole("button", { name: /create deck/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not create the deck. Try again.",
    );
  });

  it("prompts for confirmation on a dirty Cancel and aborts on deny", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <DeckFormShell
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Spanish Basics", href: "/decks/abc" },
          { label: "Edit deck" },
        ]}
      >
        <DeckForm
          mode="edit"
          action={vi.fn()}
          deck={{
            id: "abc",
            name: "Spanish Basics",
            description: null,
          }}
        />
      </DeckFormShell>,
    );

    // Make the form dirty via an input event.
    await user.type(screen.getByLabelText(/deck name/i), " updated");

    await user.click(screen.getByRole("link", { name: /cancel/i }));
    expect(confirm).toHaveBeenCalledOnce();
  });
});
