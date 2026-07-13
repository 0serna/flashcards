"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { waitForPendingMutations } from "@/lib/navigation/pending-mutations";
import { getReleaseId } from "@/lib/release/release-metadata";

import { Button } from "@/components/ui/button";

const RELEASE_ENDPOINT = "/api/release";

type CheckState = "idle" | "available" | "reloading";

/**
 * Compact, persistent `Update` action that appears beside the Flashcards
 * logo when the release loaded by the client differs from the active
 * production release.
 *
 * - Checks on mount and on every document visibility / window focus
 *   return, never on a periodic timer.
 * - Deduplicates overlapping in-flight requests and ignores
 *   late-arriving completions after unmount.
 * - Network, response, and parsing failures stay silent so the
 *   interface is never noisy.
 * - Activating `Update` waits up to 15 seconds for any pending
 *   authenticated mutation to settle before reloading the current
 *   document. The dirty-form `beforeunload` guard is the source of
 *   truth for unsaved changes; the browser's own prompt keeps the
 *   document loaded when the user declines.
 */
export function ReleaseUpdateButton() {
  const loadedReleaseId = getReleaseId();
  const [activeReleaseId, setActiveReleaseId] = useState<string | null>(null);
  const [state, setState] = useState<CheckState>("idle");
  const inFlightRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const reconcileState = useCallback(
    (next: string | null) => {
      setActiveReleaseId(next);
      setState(
        next !== null && next !== loadedReleaseId ? "available" : "idle",
      );
    },
    [loadedReleaseId],
  );

  const performCheck = useCallback(async () => {
    if (!loadedReleaseId) return;
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    const check = (async () => {
      try {
        const response = await fetch(RELEASE_ENDPOINT, {
          cache: "no-store",
          credentials: "omit",
        });
        if (!response.ok) return;
        const body = (await response.json()) as { releaseId?: unknown };
        if (!mountedRef.current) return;
        if (typeof body.releaseId === "string") {
          reconcileState(body.releaseId);
        } else if (body.releaseId === null) {
          reconcileState(null);
        }
      } catch {
        // Silent: a later foreground event is allowed to retry.
      }
    })();

    inFlightRef.current = check;
    try {
      await check;
    } finally {
      if (inFlightRef.current === check) {
        inFlightRef.current = null;
      }
    }
  }, [loadedReleaseId, reconcileState]);

  useEffect(() => {
    mountedRef.current = true;
    if (!loadedReleaseId) return;

    void performCheck();

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void performCheck();
      }
    }

    function handleFocus() {
      void performCheck();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadedReleaseId, performCheck]);

  const handleUpdate = useCallback(async () => {
    if (state === "reloading") return;
    setState("reloading");

    const didSettle = await waitForPendingMutations();

    if (!mountedRef.current) return;
    if (!didSettle) {
      // The wait timed out. Re-arm the persistent action so the user
      // can try again.
      setState("available");
      return;
    }

    // `window.location.reload` triggers the existing
    // `useUnsavedChangesWarning` `beforeunload` listener, which shows
    // the browser-native prompt for dirty forms. When the user
    // declines, the document stays loaded but the reload call has
    // already returned. Probe shortly afterwards to re-arm the
    // persistent action in that branch.
    window.location.reload();
    window.setTimeout(() => {
      if (mountedRef.current) {
        setState("available");
      }
    }, 200);
  }, [state]);

  if (state !== "available" && state !== "reloading") return null;
  if (!loadedReleaseId || activeReleaseId === null) return null;

  const isReloading = state === "reloading";
  const label = isReloading ? "Updating\u2026" : "Update";

  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="sr-only" aria-live="polite">
        An app update is available.
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="px-3 text-sm text-info hover:bg-info-surface hover:text-info focus-visible:ring-info"
        onClick={() => void handleUpdate()}
        disabled={isReloading}
        aria-label={label}
        data-release-update-action="true"
      >
        <RefreshCw
          aria-hidden="true"
          className={isReloading ? "motion-safe:animate-spin" : undefined}
        />
        {label}
      </Button>
    </div>
  );
}
