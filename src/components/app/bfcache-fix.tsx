"use client";

import { useEffect } from "react";

/**
 * Workaround for a known Next.js 16 dev-mode bug where restoring a page
 * from the browser's Back-Forward Cache (BFCache) deadlocks the JS thread.
 *
 * The page visually restores but all React event handlers become
 * unresponsive. Forcing a reload on BFCache restore guarantees a clean
 * runtime state.
 *
 * This only fires in development; in production builds the HMR runtime
 * that triggers the deadlock doesn't exist, so the workaround is harmless
 * but unnecessary.
 *
 * @see https://github.com/vercel/next.js/issues/94254
 */
export function BFCacheFix() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
