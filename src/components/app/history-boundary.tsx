"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { resolveParentPath } from "@/lib/navigation/parent-route";
import { isPendingMutation } from "@/lib/navigation/pending-mutations";

import { isFormDirty, UNSAVED_CHANGES_MESSAGE } from "./dirty-form-store";
import {
  announceNavigationStart,
  cancelNavigationLoading,
} from "./navigation-loading";

const HISTORY_MARKER = "flashcards:history-boundary";
const SCROLL_OPTION = { scroll: false } as const;

type MarkedHistoryState = {
  [HISTORY_MARKER]?: boolean;
};

function isMarkedState(state: unknown): state is MarkedHistoryState {
  return typeof state === "object" && state !== null;
}

/**
 * Mark a history entry as boundary-owned. We use the state's slot rather
 * than the URL so the marker survives a `replaceState` rewrite during
 * route transitions.
 */
function installMarker(state: unknown): MarkedHistoryState {
  if (isMarkedState(state)) {
    return { ...state, [HISTORY_MARKER]: true };
  }
  return { [HISTORY_MARKER]: true };
}

function entryIsMarked(state: unknown): boolean {
  return isMarkedState(state) && state[HISTORY_MARKER] === true;
}

function currentRelativeUrl(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function pushControlledEntry(url: string) {
  window.history.pushState(installMarker(window.history.state), "", url);
}

/**
 * Centralized authenticated history ownership.
 *
 * Mounted by `AppScreen` only when `signOutAction` is provided, this
 * boundary is the sole client-side handler for browser Back on
 * authenticated screens. It:
 *
 * 1. Pushes a marked entry on mount and on every route transition so the
 *    stack always has a controllable current entry.
 * 2. Resolves a Back gesture to the immediate hierarchical parent via
 *    `resolveParentPath`.
 * 3. Composes with the dirty-form guard and the pending-mutation signal
 *    so unsaved work and in-flight mutations are protected.
 * 4. Neutralizes Forward by replacing the resolved parent with
 *    `replace` semantics.
 *
 * `/login` and the centered error surfaces do not mount the boundary, so
 * the browser's default chronological history remains in place there.
 */
export function HistoryBoundary() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  const currentUrlRef = useRef(pathname);
  const traversalLockRef = useRef(false);
  const traversalTargetRef = useRef<string | null>(null);
  const lastHandledKeyRef = useRef<number | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
    currentUrlRef.current = currentRelativeUrl();
    if (pathname === traversalTargetRef.current) {
      traversalLockRef.current = false;
      traversalTargetRef.current = null;
    }
  }, [pathname]);

  // Ensure the current entry is marked and a fresh controlled entry sits
  // at the top of the stack. We do this on mount and on every path
  // change so direct entries and refreshes get the same protection.
  useEffect(() => {
    function ensureControlledEntry() {
      if (!entryIsMarked(window.history.state)) {
        pushControlledEntry(currentUrlRef.current);
      }
    }

    ensureControlledEntry();
  }, [pathname]);

  const handlePopState = useCallback(
    (event: PopStateEvent) => {
      // Next's App Router also listens on window. Intercept during capture so
      // it cannot restore the chronological destination in parallel with the
      // hierarchical replacement below.
      event.stopImmediatePropagation();

      // De-duplicate the same popstate event arriving multiple times via
      // re-entrant navigation handling.
      if (lastHandledKeyRef.current === event.timeStamp) {
        return;
      }
      lastHandledKeyRef.current = event.timeStamp;

      if (traversalLockRef.current) {
        // Another traversal is already in flight: restore the current
        // entry and ignore the duplicate gesture.
        window.history.pushState(
          installMarker(window.history.state),
          "",
          currentUrlRef.current,
        );
        cancelNavigationLoading();
        return;
      }

      const currentPath = pathnameRef.current;
      const parent = resolveParentPath(currentPath);

      // Always restore a marked entry at the current path first. This
      // discards the chronological destination the browser already
      // moved to and gives Forward no descendant to reopen.
      window.history.pushState(
        installMarker(window.history.state),
        "",
        currentUrlRef.current,
      );

      if (parent === currentPath) {
        // Home absorption: nothing to do. The controlled entry is now
        // back on the current path, so subsequent Forward presses have
        // nothing meaningful to restore.
        cancelNavigationLoading();
        return;
      }

      if (isPendingMutation()) {
        // A save/archive/restore/study mutation is in flight. Stay on
        // the current screen and let the mutation complete.
        cancelNavigationLoading();
        return;
      }

      if (isFormDirty()) {
        const confirmed = window.confirm(UNSAVED_CHANGES_MESSAGE);
        if (!confirmed) {
          cancelNavigationLoading();
          return;
        }
        // Caller clears the dirty store once it observes the
        // navigation start; we just route to the parent.
      }

      traversalLockRef.current = true;
      traversalTargetRef.current = parent;
      announceNavigationStart();
      router.replace(parent, SCROLL_OPTION);
      // Keep the lock held until the pathname effect observes the target.
      // A real browser traversal can emit additional history work while
      // Next is replacing the route; releasing in a microtask allowed that
      // work to climb a second level (for example, Edit card → Home).
    },
    [router],
  );

  useEffect(() => {
    window.addEventListener("popstate", handlePopState, true);
    return () => window.removeEventListener("popstate", handlePopState, true);
  }, [handlePopState]);

  return null;
}
