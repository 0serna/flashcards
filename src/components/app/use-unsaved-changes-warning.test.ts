import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";
import {
  __resetDirtyFormStoreForTests,
  markFormDirty,
  isFormDirty,
  markFormClean,
} from "./dirty-form-store";

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
  vi.restoreAllMocks();
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
    const pushState = vi.spyOn(window.history, "pushState");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});

    renderHook(() => useUnsavedChangesWarning());
    markFormDirty();
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(confirm).toHaveBeenCalledOnce();
    expect(pushState).toHaveBeenCalled();
    expect(back).toHaveBeenCalledOnce();
    expect(isFormDirty()).toBe(false);
  });

  it("keeps the current route when a browser back is denied", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const pushState = vi.spyOn(window.history, "pushState");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});

    renderHook(() => useUnsavedChangesWarning());
    markFormDirty();
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(confirm).toHaveBeenCalledOnce();
    expect(pushState).toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
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
