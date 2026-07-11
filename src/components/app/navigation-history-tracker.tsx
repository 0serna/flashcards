"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { recordAppPath } from "./navigation-history-store";

/**
 * Records the previous authenticated route so transient form saves can use
 * `router.back()` only when the expected parent is actually in app history.
 */
export function NavigationHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordAppPath(pathname);
  }, [pathname]);

  return null;
}
