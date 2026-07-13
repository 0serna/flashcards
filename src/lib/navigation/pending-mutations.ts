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
 *
 * Callers that need to wait for all in-flight mutations to settle (the
 * release update reload) use `waitForPendingMutations` so they do not
 * have to read the counter or build their own polling loop.
 */

const DEFAULT_WAIT_TIMEOUT_MS = 15_000;

let pendingCount = 0;
const settlementListeners = new Set<() => void>();

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
        notifySettlement();
      }) as T;
    }
    pendingCount -= 1;
    notifySettlement();
    return result;
  } catch (error) {
    pendingCount -= 1;
    notifySettlement();
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

function notifySettlement() {
  // Snapshot the listeners before invoking them so a listener that
  // unsubscribes itself does not mutate the live set mid-iteration.
  for (const listener of Array.from(settlementListeners)) {
    listener();
  }
}

/**
 * Wait until no authenticated mutations are pending, up to
 * `timeoutMs`. Resolves with `true` once the store drains, and with
 * `false` if the timeout elapses first. When no mutation is pending on
 * entry, resolves `true` on the next microtask.
 *
 * Concurrent calls each subscribe their own listener; the timer is
 * cleared as soon as the store drains so waiters do not leak. Mutations
 * that start after the call still trigger settlement once they finish,
 * so a waiter parked on an in-flight save will see a later
 * archive/restore that ran while it was waiting.
 */
export function waitForPendingMutations(
  timeoutMs: number = DEFAULT_WAIT_TIMEOUT_MS,
): Promise<boolean> {
  if (pendingCount === 0) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;

    const finish = (didSettle: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      settlementListeners.delete(onSettle);
      resolve(didSettle);
    };

    function onSettle() {
      if (pendingCount === 0) {
        finish(true);
      }
    }

    const timer = setTimeout(() => {
      finish(false);
    }, timeoutMs);

    settlementListeners.add(onSettle);

    // The store may have drained between the early-return check and
    // the listener registration; in that case resolve immediately.
    if (pendingCount === 0) {
      finish(true);
    }
  });
}

/** Test-only reset. Keeps the module singleton hermetic between tests. */
export function __resetPendingMutationsForTests(): void {
  pendingCount = 0;
  settlementListeners.clear();
}
