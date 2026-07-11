"use client";

import { useEffect, useRef } from "react";

import { markFormClean, markFormDirty } from "./dirty-form-store";
import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";

/**
 * Wire a form element to the dirty-form store.
 *
 * On mount the store is reset to clean so the form always starts from a
 * known state (covers navigation back to a freshly-loaded form). The first
 * `input` or `change` on any descendant marks the form dirty, while hard-exit
 * and soft-history warnings are installed for the lifetime of the form.
 *
 * Returns a ref that must be attached to the underlying `<form>` element.
 */
export function useDirtyFormTracker<
  T extends HTMLFormElement = HTMLFormElement,
>() {
  useUnsavedChangesWarning();
  const formRef = useRef<T>(null);

  useEffect(() => {
    markFormClean();
    const form = formRef.current;
    if (!form) return;

    function onFieldChange() {
      markFormDirty();
    }

    form.addEventListener("input", onFieldChange);
    form.addEventListener("change", onFieldChange);
    return () => {
      form.removeEventListener("input", onFieldChange);
      form.removeEventListener("change", onFieldChange);
      // Let a same-turn popstate guard inspect the dirty state before the
      // unmount cleanup resets it.
      queueMicrotask(markFormClean);
    };
  }, []);

  return formRef;
}
