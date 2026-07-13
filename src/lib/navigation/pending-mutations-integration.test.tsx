import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppScreen } from "@/components/app-screen";
import { __resetPendingMutationsForTests } from "@/lib/navigation/pending-mutations";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

const route = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/app/navigation-loading", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/components/app/navigation-loading")
    >();
  return {
    ...actual,
    announceNavigationStart: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  route.pathname = "/";
  router.replace.mockReset();
  router.back.mockReset();
  router.forward.mockReset();
  window.history.replaceState(null, "", "/");
  __resetPendingMutationsForTests();
  vi.restoreAllMocks();
});

beforeEach(() => {
  __resetPendingMutationsForTests();
  window.history.replaceState(null, "", "/");
});

function dispatchPopState() {
  act(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

/**
 * Sanity checks that the AppScreen-mounted boundary actually consults
 * the shared pending-mutation signal. The boundary is exercised in
 * detail by `history-boundary.test.tsx`; these tests only verify the
 * wiring from the shell to the boundary.
 */
describe("AppScreen + pending mutation signal", () => {
  it("ignores Back when a DeckForm save mutation is pending", async () => {
    route.pathname = "/decks/abc/edit";
    window.history.pushState(null, "", "/decks/abc/edit");

    const { DeckForm } = await import("@/components/decks/deck-form");

    const { getByRole } = render(
      <AppScreen signOutAction={vi.fn()}>
        <DeckForm
          mode="edit"
          action={vi.fn().mockImplementation(() => new Promise(() => {}))}
          deck={{ id: "abc", name: "Spanish Basics", description: null }}
        />
      </AppScreen>,
    );

    const input = getByRole("textbox", { name: /deck name/i });
    act(() => {
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // The DeckForm awaits the action; we don't resolve the promise.
    getByRole("button", { name: /save changes/i }).click();
    await Promise.resolve();

    dispatchPopState();

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("ignores Back when a StudySession rating submission is pending", async () => {
    route.pathname = "/decks/abc/study";
    window.history.pushState(null, "", "/decks/abc/study");

    const { StudySession } = await import("@/components/study/study-session");
    const userModule = await import("@testing-library/user-event");
    const user = userModule.default.setup();

    const submitRating = vi
      .fn()
      .mockImplementation(() => new Promise(() => {}));

    const cards = [
      {
        id: "card-1",
        schedulingVersion: 0,
        deckId: "abc",
        front: { text: "Hola", imageUrl: null },
        back: { text: "Hello", imageUrl: null },
      },
    ];

    const { getByRole } = render(
      <AppScreen signOutAction={vi.fn()}>
        <StudySession
          mode="review"
          deckId="abc"
          deckName="Spanish Basics"
          initialCards={cards}
          submitRating={submitRating}
        />
      </AppScreen>,
    );

    await user.click(getByRole("button", { name: /show back/i }));
    await user.click(getByRole("button", { name: /i forgot/i }));

    dispatchPopState();

    expect(router.replace).not.toHaveBeenCalled();
  });
});
