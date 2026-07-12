import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";
import {
  __resetDirtyFormStoreForTests,
  markFormDirty,
  isFormDirty,
  markFormClean,
} from "./dirty-form-store";
import { HistoryBoundary } from "./history-boundary";
import { __resetPendingMutationsForTests } from "@/lib/navigation/pending-mutations";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
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

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
  __resetPendingMutationsForTests();
  route.pathname = "/";
  router.replace.mockReset();
  router.back.mockReset();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

beforeEach(() => {
  __resetDirtyFormStoreForTests();
  __resetPendingMutationsForTests();
  window.history.replaceState(null, "", "/");
});

describe("useUnsavedChangesWarning", () => {
  beforeEach(() => {
    __resetDirtyFormStoreForTests();
  });

  it("registers browser warning listeners and removes them on unmount", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useUnsavedChangesWarning());

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );
  });

  it("prevents default when the form is dirty", () => {
    renderHook(() => useUnsavedChangesWarning());
    markFormDirty();

    const event = new Event("beforeunload") as BeforeUnloadEvent;
    const preventDefault = vi.spyOn(event, "preventDefault");

    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  it("restores the current route before allowing a confirmed browser back", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    route.pathname = "/decks/abc";
    window.history.pushState(null, "", "/decks/abc");
    render(<HistoryBoundary />);

    markFormDirty();

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // The boundary must ask for confirmation through the centralized
    // handler and, on accept, route to the parent (Home for a deck
    // detail page).
    expect(confirm).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith("/", { scroll: false });
  });

  it("keeps the current route when a browser back is denied", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    route.pathname = "/decks/abc";
    window.history.pushState(null, "", "/decks/abc");
    render(<HistoryBoundary />);

    markFormDirty();

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(confirm).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
    expect(isFormDirty()).toBe(true);
  });

  it("does not prevent default when the form is clean", () => {
    renderHook(() => useUnsavedChangesWarning());
    markFormClean();

    const event = new Event("beforeunload") as BeforeUnloadEvent;
    const preventDefault = vi.spyOn(event, "preventDefault");

    window.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
