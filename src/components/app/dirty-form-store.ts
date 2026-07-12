/**
 * Module-level store for the dirty-form guard.
 *
 * Forms call `markFormDirty()` when a user edits a field and
 * `markFormClean()` after a successful submission. Shell navigation
 * primitives (header logo, breadcrumb, guarded links) consult
 * `isFormDirty()` on each interaction so they can ask for confirmation
 * while the form is dirty.
 *
 * The store is intentionally a module singleton rather than React context.
 * The shell header sits above the form in the tree, and module state keeps
 * the wiring tiny without forcing every authenticated page into a client
 * provider.
 */

export const UNSAVED_CHANGES_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?";

let dirty = false;
let protectedHistoryEntry: {
  state: unknown;
  url: string;
} | null = null;
let popstateGuardLocked = false;

export function markFormDirty(): void {
  if (dirty) return;
  dirty = true;
  if (typeof window !== "undefined") {
    protectedHistoryEntry = {
      state: window.history.state,
      url: window.location.href,
    };
  }
}

export function markFormClean(): void {
  if (!dirty) return;
  dirty = false;
  protectedHistoryEntry = null;
}

export function isFormDirty(): boolean {
  return dirty;
}

function onDirtyFormPopState(event: PopStateEvent): void {
  if (!dirty || !protectedHistoryEntry) return;

  // Guard against re-entrant popstate events while the dialog is already
  // open. Without this lock, rapid back-button presses could stack
  // pushState calls and corrupt the history.
  if (popstateGuardLocked) return;
  popstateGuardLocked = true;

  event.stopImmediatePropagation();

  // Push the protected entry back so the URL stays on the dirty page.
  // This must happen before the synchronous confirm() because the browser
  // has already navigated to the previous entry.
  window.history.pushState(
    protectedHistoryEntry.state,
    "",
    protectedHistoryEntry.url,
  );

  let confirmed = false;
  try {
    confirmed = window.confirm(UNSAVED_CHANGES_MESSAGE);
  } finally {
    popstateGuardLocked = false;
  }

  if (!confirmed) return;

  markFormClean();

  // Trigger a fresh popstate that Next.js can handle normally now that
  // the dirty guard is disarmed.
  window.history.back();
}

if (typeof window !== "undefined") {
  // Register once for the lifetime of the client module. A form component may
  // unmount during Next's popstate handling, so a component-owned listener is
  // too late to protect the transition reliably.
  window.addEventListener("popstate", onDirtyFormPopState, true);
}

/** Test-only reset. Keeps unit tests hermetic. */
export function __resetDirtyFormStoreForTests(): void {
  dirty = false;
  protectedHistoryEntry = null;
  popstateGuardLocked = false;
}
