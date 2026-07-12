/**
 * Shared pending-mutation signal.
 *
 * Authenticated save, archive, restore, and study-rating work is
 * registered here so the history boundary can ignore browser Back while a
 * mutation is in flight. The store is intentionally module-level: shell
 * navigation primitives and the history boundary live above the screens
 * where the mutations originate.
 *
 * Every registration is wrapped in `try/finally` so a thrown or rejected
 * callback can never leave the boundary stuck in a "mutations pending"
 * state where Back stops working.
 */

let pendingCount = 0;

export function isPendingMutation(): boolean {
  return pendingCount > 0;
}

/**
 * Runs `callback` while signaling that an authenticated mutation is in
 * flight. The signal is released even if the callback throws or rejects.
 * The returned value is awaited when the callback returns a thenable, so
 * callers can compose the helper around async server actions.
 */
export function runWithPendingMutation<T>(callback: () => T): T {
  pendingCount += 1;
  try {
    const result = callback();
    if (isThenable(result)) {
      return Promise.resolve(result).finally(() => {
        pendingCount -= 1;
      }) as T;
    }
    pendingCount -= 1;
    return result;
  } catch (error) {
    pendingCount -= 1;
    throw error;
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/** Test-only reset. Keeps the module singleton hermetic between tests. */
export function __resetPendingMutationsForTests(): void {
  pendingCount = 0;
}
