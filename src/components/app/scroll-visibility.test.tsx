import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollVisibility } from "./scroll-visibility";

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom starts each test with a classList that may carry over from
  // previous tests; clear it explicitly.
  document.documentElement.className = "";
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ScrollVisibility", () => {
  it("marks the document root as scrolling while a scroll event is active", () => {
    render(<ScrollVisibility />);

    window.dispatchEvent(new Event("scroll"));

    expect(document.documentElement.classList.contains("is-scrolling")).toBe(
      true,
    );
  });

  it("removes the scrolling class after the inactivity window", () => {
    render(<ScrollVisibility />);

    window.dispatchEvent(new Event("scroll"));
    expect(document.documentElement.classList.contains("is-scrolling")).toBe(
      true,
    );

    vi.advanceTimersByTime(800);
    expect(document.documentElement.classList.contains("is-scrolling")).toBe(
      false,
    );
  });

  it("resets the inactivity timer when scrolling continues", () => {
    render(<ScrollVisibility />);

    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(400);
    // Still within the inactivity window.
    expect(document.documentElement.classList.contains("is-scrolling")).toBe(
      true,
    );

    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(400);
    // After the second scroll, the timer should have been reset, so we
    // are still inside the new window.
    expect(document.documentElement.classList.contains("is-scrolling")).toBe(
      true,
    );

    vi.advanceTimersByTime(400);
    // 800ms after the last scroll: class should be gone.
    expect(document.documentElement.classList.contains("is-scrolling")).toBe(
      false,
    );
  });

  it("removes its scroll listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<ScrollVisibility />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});
