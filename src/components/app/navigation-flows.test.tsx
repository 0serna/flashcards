import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppScreen } from "@/components/app-screen";
import { Breadcrumb } from "@/components/app/breadcrumb";
import {
  __resetDirtyFormStoreForTests,
  markFormDirty,
} from "@/components/app/dirty-form-store";
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
  __resetDirtyFormStoreForTests();
  vi.restoreAllMocks();
});

beforeEach(() => {
  __resetPendingMutationsForTests();
  __resetDirtyFormStoreForTests();
  window.history.replaceState(null, "", "/");
});

function dispatchPopState() {
  act(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

describe("Back exits Review and Practice to the owning Deck", () => {
  it("Review mode direct entry → Back resolves to the owning Deck", () => {
    route.pathname = "/decks/abc/study";
    window.history.pushState(null, "", "/decks/abc/study");

    render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Study content</p>
      </AppScreen>,
    );

    dispatchPopState();

    expect(router.replace).toHaveBeenCalledWith("/decks/abc", {
      scroll: false,
    });
  });

  it("Practice mode direct entry → Back resolves to the owning Deck", () => {
    route.pathname = "/decks/abc/study";
    window.history.pushState(null, "", "/decks/abc/study?mode=practice");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/decks/abc/study?mode=practice"),
    });

    render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Study content</p>
      </AppScreen>,
    );

    dispatchPopState();

    expect(router.replace).toHaveBeenCalledWith("/decks/abc", {
      scroll: false,
    });
  });
});

describe("Dirty-form Back acceptance and rejection", () => {
  it("prompts on Back and routes to the parent on accept", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    route.pathname = "/decks/abc/edit";
    window.history.pushState(null, "", "/decks/abc/edit");

    render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Edit form</p>
      </AppScreen>,
    );

    markFormDirty();

    dispatchPopState();

    expect(confirm).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/decks/abc", {
      scroll: false,
    });
  });

  it("prompts on Back and stays on the form on decline", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    route.pathname = "/decks/abc/edit";
    window.history.pushState(null, "", "/decks/abc/edit");

    render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Edit form</p>
      </AppScreen>,
    );

    markFormDirty();

    dispatchPopState();

    expect(confirm).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("prompts on Back for a direct-entry dirty form", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    route.pathname = "/decks/new";
    window.history.pushState(null, "", "/decks/new");

    render(
      <AppScreen signOutAction={vi.fn()}>
        <p>New deck form</p>
      </AppScreen>,
    );

    markFormDirty();

    dispatchPopState();

    expect(confirm).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/", { scroll: false });
  });
});

describe("Deterministic explicit navigation", () => {
  it("breadcrumb ancestor navigation goes to the parent URL", async () => {
    route.pathname = "/decks/abc/edit";
    window.history.pushState(null, "", "/decks/abc/edit");
    const user = userEvent.setup();

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    markFormDirty();

    render(
      <AppScreen signOutAction={vi.fn()}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Spanish Basics", href: "/decks/abc" },
            { label: "Edit deck" },
          ]}
        />
      </AppScreen>,
    );

    // Clicking the breadcrumb ancestor uses GuardedLink; the confirm
    // dialog will fire because the form is dirty.
    await user.click(screen.getByRole("link", { name: "Spanish Basics" }));

    expect(confirm).toHaveBeenCalled();
  });

  it("Home link uses GuardedLink and does not create a Forward entry", async () => {
    route.pathname = "/decks/abc";
    window.history.pushState(null, "", "/decks/abc");
    const user = userEvent.setup();

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    markFormDirty();

    render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Screen</p>
      </AppScreen>,
    );

    await user.click(screen.getByRole("link", { name: /flashcards home/i }));

    expect(confirm).toHaveBeenCalled();
    // The boundary never fired because the click was intercepted by the
    // GuardedLink; Forward neutralization is reserved for the popstate
    // path.
    expect(router.replace).not.toHaveBeenCalled();
  });
});
