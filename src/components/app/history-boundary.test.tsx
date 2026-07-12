import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetPendingMutationsForTests } from "@/lib/navigation/pending-mutations";
import { resolveParentPath } from "@/lib/navigation/parent-route";
import { announceNavigationStart } from "./navigation-loading";
import { __resetDirtyFormStoreForTests } from "./dirty-form-store";
import { HistoryBoundary } from "./history-boundary";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

const route = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => route.pathname,
}));

vi.mock("./navigation-loading", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./navigation-loading")>();
  return {
    ...actual,
    announceNavigationStart: vi.fn(),
  };
});

const announceNavigationStartMock = vi.mocked(announceNavigationStart);

afterEach(() => {
  cleanup();
  __resetPendingMutationsForTests();
  __resetDirtyFormStoreForTests();
  vi.unstubAllGlobals();
  route.pathname = "/";
  router.replace.mockReset();
  router.back.mockReset();
  router.forward.mockReset();
  announceNavigationStartMock.mockReset();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

beforeEach(() => {
  __resetPendingMutationsForTests();
  __resetDirtyFormStoreForTests();
  // Reset to a known start state: one history entry pointing at "/".
  window.history.replaceState(null, "", "/");
});

/**
 * Build a controlled history stack with N entries. The current entry's
 * URL is taken from `currentUrl` (pathname + optional query).
 */
function seedHistory(entries: string[], currentUrl: string) {
  // Start from a known single-entry stack.
  window.history.replaceState(null, "", "/");
  entries.slice(0, -1).forEach((entry) => {
    window.history.pushState(null, "", entry);
  });
  // Land on the final entry that the test wants as the "current" URL.
  window.history.pushState(null, "", currentUrl);
}

function dispatchPopState() {
  act(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

describe("HistoryBoundary", () => {
  it("preserves the query string when controlling a direct entry", () => {
    window.history.replaceState(null, "", "/decks/abc/study?mode=practice");
    route.pathname = "/decks/abc/study";

    render(<HistoryBoundary />);

    expect(window.location.pathname + window.location.search).toBe(
      "/decks/abc/study?mode=practice",
    );
  });

  it("intercepts popstate before pre-existing framework listeners", () => {
    seedHistory(["/"], "/decks/abc");
    route.pathname = "/decks/abc";
    const frameworkListener = vi.fn();
    window.addEventListener("popstate", frameworkListener);

    render(<HistoryBoundary />);
    dispatchPopState();

    expect(frameworkListener).not.toHaveBeenCalled();
    window.removeEventListener("popstate", frameworkListener);
  });

  it("resolves a Back gesture to the immediate parent for a nested screen", () => {
    seedHistory(["/", "/decks/abc"], "/decks/abc/cards/new");
    route.pathname = "/decks/abc/cards/new";

    render(<HistoryBoundary />);

    dispatchPopState();

    expect(router.replace).toHaveBeenCalledWith("/decks/abc", {
      scroll: false,
    });
  });

  it("ascends a Deck detail to Home when Back is invoked", () => {
    seedHistory(["/"], "/decks/abc");
    route.pathname = "/decks/abc";

    render(<HistoryBoundary />);

    dispatchPopState();

    expect(router.replace).toHaveBeenCalledWith("/", { scroll: false });
  });

  it("absorbs Back on Home without triggering a navigation", () => {
    seedHistory(["/"], "/");
    route.pathname = "/";

    render(<HistoryBoundary />);

    dispatchPopState();

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it("ignores rapid repeated popstate events while a navigation is in flight", () => {
    seedHistory(["/"], "/decks/abc/cards/new");
    route.pathname = "/decks/abc/cards/new";

    render(<HistoryBoundary />);

    dispatchPopState();
    dispatchPopState();
    dispatchPopState();

    // The traversal lock collapses the burst into a single parent call.
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it("ignores Back while a pending mutation is registered", async () => {
    seedHistory(["/"], "/decks/abc");
    route.pathname = "/decks/abc";

    const { rerender } = render(<HistoryBoundary />);

    // Register a pending mutation without resolving it.
    let release: (() => void) | null = null;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    // The mutation store is the production path; we use a manual flag to
    // avoid pulling the helper into the test.
    const { runWithPendingMutation } =
      await import("@/lib/navigation/pending-mutations");
    const tracking = runWithPendingMutation(() => pending);

    rerender(<HistoryBoundary />);

    dispatchPopState();

    expect(router.replace).not.toHaveBeenCalled();

    release?.();
    await tracking;
  });

  it("prompts for confirmation when a dirty form is active and Back is invoked", async () => {
    seedHistory(["/"], "/decks/abc");
    route.pathname = "/decks/abc";

    render(<HistoryBoundary />);

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { markFormDirty, __resetDirtyFormStoreForTests } =
      await import("./dirty-form-store");
    __resetDirtyFormStoreForTests();
    markFormDirty();

    dispatchPopState();

    expect(confirm).toHaveBeenCalled();
    // On confirm, the boundary proceeds to the parent.
    expect(router.replace).toHaveBeenCalledWith("/", { scroll: false });
  });

  it("keeps the current route when the dirty-form prompt is declined", async () => {
    seedHistory(["/"], "/decks/abc");
    route.pathname = "/decks/abc";

    render(<HistoryBoundary />);

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { markFormDirty, __resetDirtyFormStoreForTests } =
      await import("./dirty-form-store");
    __resetDirtyFormStoreForTests();
    markFormDirty();

    dispatchPopState();

    expect(confirm).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does not announce navigation start when Back is absorbed at Home", () => {
    seedHistory(["/"], "/");
    route.pathname = "/";

    render(<HistoryBoundary />);

    dispatchPopState();

    expect(announceNavigationStartMock).not.toHaveBeenCalled();
  });

  it("announces navigation start once the parent transition begins", () => {
    seedHistory(["/"], "/decks/abc/cards/new");
    route.pathname = "/decks/abc/cards/new";

    render(<HistoryBoundary />);

    dispatchPopState();

    expect(announceNavigationStartMock).toHaveBeenCalledTimes(1);
  });
});

describe("resolveParentPath (boundary integration)", () => {
  it("agrees with the boundary's parent for every authenticated route", () => {
    // Spot check: any route we know must produce a non-`/` parent
    // that is itself a recognized authenticated route or Home.
    const cases: Array<[string, string]> = [
      ["/decks/abc", "/"],
      ["/decks/abc/edit", "/decks/abc"],
      ["/decks/abc/cards/new", "/decks/abc"],
      ["/decks/abc/cards/archived", "/decks/abc"],
      ["/decks/abc/study?mode=review", "/decks/abc"],
      ["/decks/abc/study?mode=practice", "/decks/abc"],
      ["/decks/abc/cards/card-9/edit", "/decks/abc"],
    ];

    for (const [path, expected] of cases) {
      expect(resolveParentPath(path)).toBe(expected);
    }
  });
});
