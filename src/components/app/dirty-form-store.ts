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

  event.stopImmediatePropagation();
  window.history.pushState(
    protectedHistoryEntry.state,
    "",
    protectedHistoryEntry.url,
  );

  if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) return;

  markFormClean();
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
}
