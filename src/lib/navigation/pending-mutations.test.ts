import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __resetPendingMutationsForTests,
  isPendingMutation,
  runWithPendingMutation,
  waitForPendingMutations,
} from "./pending-mutations";

afterEach(() => {
  __resetPendingMutationsForTests();
  vi.useRealTimers();
});

describe("pending mutations store", () => {
  it("starts with no pending mutation", () => {
    expect(isPendingMutation()).toBe(false);
  });

  it("marks a mutation as pending for the lifetime of the callback", () => {
    let observedInsideCallback = false;
    runWithPendingMutation(() => {
      observedInsideCallback = isPendingMutation();
    });

    expect(observedInsideCallback).toBe(true);
    expect(isPendingMutation()).toBe(false);
  });

  it("clears the pending state when the callback throws", () => {
    expect(() =>
      runWithPendingMutation(() => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(isPendingMutation()).toBe(false);
  });

  it("supports nested calls and only clears once the outer call ends", () => {
    let outerSeenNested = false;

    runWithPendingMutation(() => {
      runWithPendingMutation(() => {
        outerSeenNested = isPendingMutation();
      });
    });

    expect(outerSeenNested).toBe(true);
    expect(isPendingMutation()).toBe(false);
  });

  it("awaits async callbacks and clears after the promise settles", async () => {
    let resolveAsync: (() => void) | null = null;

    const pending = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveAsync = resolve;
        }),
    );

    expect(isPendingMutation()).toBe(true);
    resolveAsync?.();
    await pending;
    expect(isPendingMutation()).toBe(false);
  });

  it("clears after an async callback rejects", async () => {
    const pending = runWithPendingMutation(async () => {
      throw new Error("async boom");
    });
    await expect(pending).rejects.toThrow("async boom");
    expect(isPendingMutation()).toBe(false);
  });
});

describe("waitForPendingMutations", () => {
  it("resolves immediately when no mutation is pending", async () => {
    vi.useFakeTimers();
    const start = Date.now();
    const promise = waitForPendingMutations(15_000);

    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBe(true);
    expect(Date.now() - start).toBe(0);
  });

  it("resolves when the pending mutation settles within the timeout", async () => {
    let resolveMutation: (() => void) | null = null;
    const settled = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    );

    const waitPromise = waitForPendingMutations(15_000);

    resolveMutation?.();
    await settled;
    await expect(waitPromise).resolves.toBe(true);
  });

  it("notifies a waiter when a mutation that started later still settles", async () => {
    let resolveFirst: (() => void) | null = null;
    let resolveSecond: (() => void) | null = null;
    const first = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const waitPromise = waitForPendingMutations(15_000);

    // A second mutation is registered while the waiter is sleeping.
    const second = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveSecond = resolve;
        }),
    );

    resolveFirst?.();
    await first;
    resolveSecond?.();
    await second;
    await expect(waitPromise).resolves.toBe(true);
  });

  it("resolves false when the wait exceeds the 15-second timeout", async () => {
    vi.useFakeTimers();
    let resolveMutation: (() => void) | null = null;
    runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    );

    const waitPromise = waitForPendingMutations(15_000);

    await vi.advanceTimersByTimeAsync(14_999);
    // Still pending right before the timeout boundary.
    let settled = false;
    void waitPromise.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(waitPromise).resolves.toBe(false);

    // Resolving the original mutation afterwards does not retroactively
    // change the waiter's result, but it does drain the store.
    resolveMutation?.();
    await Promise.resolve();
    expect(isPendingMutation()).toBe(false);
  });

  it("clears its timers when the mutation settles before the timeout", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    let resolveMutation: (() => void) | null = null;
    const mutation = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    );
    const waitPromise = waitForPendingMutations(15_000);

    resolveMutation?.();
    await mutation;
    await expect(waitPromise).resolves.toBe(true);

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("keeps the existing isPendingMutation signal intact while waiting", async () => {
    let resolveMutation: (() => void) | null = null;
    const mutation = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    );

    const waitPromise = waitForPendingMutations(15_000);
    expect(isPendingMutation()).toBe(true);

    resolveMutation?.();
    await mutation;
    await waitPromise;
    expect(isPendingMutation()).toBe(false);
  });
});
