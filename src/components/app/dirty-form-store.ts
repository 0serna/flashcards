/**
 * Module-level store for the dirty-form guard.
 *
 * Forms call `markFormDirty()` when a user edits a field and
 * `markFormClean()` after a successful submission. Shell navigation
 * primitives (header logo, breadcrumb, guarded links) and the
 * authenticated history boundary consult `isFormDirty()` so they can ask
 * for confirmation while the form is dirty.
 *
 * The store is intentionally a module singleton rather than React context.
 * The shell header sits above the form in the tree, and module state keeps
 * the wiring tiny without forcing every authenticated page into a client
 * provider.
 *
 * The history boundary owns the single `popstate` handler; this store
 * no longer attaches a competing capture listener. That keeps the guard
 * composable: the boundary runs once, sees the dirty state, and prompts
 * the user before routing to the parent.
 */

export const UNSAVED_CHANGES_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?";

let dirty = false;

export function markFormDirty(): void {
  dirty = true;
}

export function markFormClean(): void {
  dirty = false;
}

export function isFormDirty(): boolean {
  return dirty;
}

/** Test-only reset. Keeps unit tests hermetic. */
export function __resetDirtyFormStoreForTests(): void {
  dirty = false;
}
