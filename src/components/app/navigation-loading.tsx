"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NAVIGATION_DELAY_MS = 150;
const NAVIGATION_START_EVENT = "flashcards:navigation-start";

/**
 * Starts the shared authenticated navigation feedback after the configured
 * delay. Guarded links use this after their confirmation step so a declined
 * unsaved-changes prompt never leaves a loading screen behind.
 */
export function announceNavigationStart() {
  document.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

function isInternalNavigation(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const link = (event.target as Element | null)?.closest(
    "a[href]",
  ) as HTMLAnchorElement | null;
  if (!link || link.dataset.navigationGuarded === "true") return false;
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download")) return false;

  const target = new URL(link.href, window.location.href);
  const current = new URL(window.location.href);

  return (
    target.origin === current.origin &&
    target.href !== current.href &&
    target.hash === ""
  );
}

/**
 * Replaces an authenticated screen only when an internal route transition is
 * slow enough to be perceptible. A document listener covers regular Next
 * links, while GuardedLink dispatches the same intent after confirmation.
 */
export function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRouteKey = useRef(routeKey);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearLoading = useCallback(() => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
    setIsLoading(false);
  }, []);

  const startLoading = useCallback(() => {
    if (delayTimer.current || isLoading) return;

    delayTimer.current = setTimeout(() => {
      delayTimer.current = null;
      setIsLoading(true);
    }, NAVIGATION_DELAY_MS);
  }, [isLoading]);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;

    previousRouteKey.current = routeKey;
    clearLoading();
  }, [clearLoading, routeKey]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isInternalNavigation(event)) startLoading();
    }

    function handleHistoryNavigation() {
      startLoading();
    }

    document.addEventListener("click", handleClick);
    document.addEventListener(NAVIGATION_START_EVENT, startLoading);
    window.addEventListener("popstate", handleHistoryNavigation);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener(NAVIGATION_START_EVENT, startLoading);
      window.removeEventListener("popstate", handleHistoryNavigation);
      if (delayTimer.current) clearTimeout(delayTimer.current);
    };
  }, [startLoading]);

  if (!isLoading) return null;

  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      aria-label="Loading your next screen"
      role="status"
      className="navigation-loading-screen fixed inset-0 z-40 flex min-h-svh items-center justify-center bg-background/80 px-4 text-foreground backdrop-blur-sm"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-6 text-muted-foreground motion-safe:animate-spin"
      />
    </section>
  );
}
