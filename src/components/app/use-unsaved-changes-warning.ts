"use client";

import { useEffect } from "react";

import { isFormDirty } from "./dirty-form-store";

/**
 * Installs browser-level warnings while the form is dirty.
 *
 * `beforeunload` covers hard exits such as refresh and closing the tab. The
 * module-level dirty-form store owns the soft-navigation `popstate` guard so
 * it remains active while Next transitions between route segments.
 */
export function useUnsavedChangesWarning(): void {
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isFormDirty()) return;
      event.preventDefault();
      // Required for Chrome to surface the native prompt.
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);
}
