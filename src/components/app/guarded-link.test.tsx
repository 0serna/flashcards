import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuardedLink } from "./guarded-link";
import {
  __resetDirtyFormStoreForTests,
  isFormDirty,
  markFormDirty,
} from "./dirty-form-store";
import {
  __resetPendingMutationsForTests,
  runWithPendingMutation,
} from "@/lib/navigation/pending-mutations";

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
  __resetPendingMutationsForTests();
  vi.restoreAllMocks();
});

describe("GuardedLink", () => {
  beforeEach(() => {
    __resetDirtyFormStoreForTests();
  });

  it("navigates without confirmation when the form is clean", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <GuardedLink href="/destination" data-testid="link">
        Go
      </GuardedLink>,
    );

    await user.click(screen.getByTestId("link"));

    expect(confirm).not.toHaveBeenCalled();
  });

  it("prompts for confirmation and aborts when the form is dirty", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    markFormDirty();

    render(
      <GuardedLink href="/destination" data-testid="link">
        Go
      </GuardedLink>,
    );

    await user.click(screen.getByTestId("link"));

    expect(confirm).toHaveBeenCalledOnce();
  });

  it("prompts and lets navigation through on confirmation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    markFormDirty();

    render(
      <GuardedLink href="/destination" data-testid="link">
        Go
      </GuardedLink>,
    );

    await user.click(screen.getByTestId("link"));

    expect(confirm).toHaveBeenCalledOnce();
  });

  it("does not prompt on the next click after a confirmed navigation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    markFormDirty();

    render(
      <GuardedLink href="/destination" data-testid="link">
        Go
      </GuardedLink>,
    );

    await user.click(screen.getByTestId("link"));
    expect(confirm).toHaveBeenCalledTimes(1);

    confirm.mockClear();
    await user.click(screen.getByTestId("link"));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("reads live store state inside the click handler (not React state)", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    markFormDirty();

    const onClick = vi.fn();
    render(
      <GuardedLink href="/destination" data-testid="link" onClick={onClick}>
        Go
      </GuardedLink>,
    );

    const link = screen.getByTestId("link");
    // First click: confirm runs, store is cleaned, onClick fires.
    link.click();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);

    // Reset the store via the public API (simulating a successful form
    // submission or a previous Cancel confirmation). Subsequent clicks
    // must not prompt.
    confirm.mockClear();
    onClick.mockClear();
    link.click();
    expect(confirm).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the form dirty when a click callback cancels navigation", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    });
    markFormDirty();

    render(
      <GuardedLink href="/destination" onClick={onClick} data-testid="link">
        Go
      </GuardedLink>,
    );

    screen.getByTestId("link").click();

    expect(confirm).toHaveBeenCalledOnce();
    expect(isFormDirty()).toBe(true);
  });

  it("blocks navigation while a mutation is pending", () => {
    const onClick = vi.fn();
    void runWithPendingMutation(() => new Promise<void>(() => undefined));

    render(
      <GuardedLink href="/destination" onClick={onClick} data-testid="link">
        Go
      </GuardedLink>,
    );

    screen.getByTestId("link").click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("bypasses the guard when bypassDirtyCheck is set", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    markFormDirty();

    render(
      <GuardedLink href="/destination" bypassDirtyCheck data-testid="link">
        Go
      </GuardedLink>,
    );
    await user.click(screen.getByTestId("link"));

    expect(confirm).not.toHaveBeenCalled();
  });
});
