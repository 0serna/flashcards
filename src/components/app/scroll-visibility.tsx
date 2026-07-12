"use client";

import { useEffect } from "react";

const SCROLLING_CLASS = "is-scrolling";
const IDLE_DELAY_MS = 700;

/**
 * Toggles the `is-scrolling` class on the document root while the page is
 * being scrolled. The class is used by the global scrollbar styles in
 * `globals.css` to fade the scrollbar thumb in and out. The class is
 * removed a short moment after scrolling stops so the thumb doesn't stay
 * visible at rest.
 */
export function ScrollVisibility() {
  useEffect(() => {
    const root = document.documentElement;
    let timeout: number | undefined;

    function handleScroll() {
      root.classList.add(SCROLLING_CLASS);
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        root.classList.remove(SCROLLING_CLASS);
      }, IDLE_DELAY_MS);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
