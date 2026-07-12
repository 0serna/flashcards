"use client";

import type { ReactNode } from "react";

import { runWithPendingMutation } from "@/lib/navigation/pending-mutations";

type PendingActionFormProps = {
  /**
   * Server action to invoke when the form is submitted. The wrapper
   * registers a pending-mutation signal before calling it so the
   * authenticated history boundary can ignore browser Back until the
   * action resolves. The signal is released automatically, even if the
   * action throws.
   */
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
};

/**
 * Client-side `<form>` wrapper that registers a pending-mutation signal
 * around a server action.
 *
 * Server components cannot set client-side navigation state directly, so
 * the archive/restore forms in the archived-decks and archived-cards
 * pages route through this wrapper. The signal is released in
 * `try/finally` semantics inside `runWithPendingMutation`, so a thrown
 * server action never leaves the boundary stuck in a "pending" state.
 */
export function PendingActionForm({
  action,
  children,
  className,
}: PendingActionFormProps) {
  return (
    <form
      action={(formData) => runWithPendingMutation(() => action(formData))}
      className={className}
    >
      {children}
    </form>
  );
}
