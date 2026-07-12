import { afterEach, describe, expect, it } from "vitest";

import {
  __resetPendingMutationsForTests,
  isPendingMutation,
  runWithPendingMutation,
} from "./pending-mutations";

afterEach(() => {
  __resetPendingMutationsForTests();
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
