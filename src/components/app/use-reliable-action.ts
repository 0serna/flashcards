"use client";

import { useCallback, useRef, useState } from "react";

import { runWithPendingMutation } from "@/lib/navigation/pending-mutations";

const UNCONFIRMED_AFTER_MS = 15_000;

export type ReliableActionResult<T> =
  { status: "settled"; value: T } | { status: "unconfirmed" };

export function useReliableAction() {
  const lockedRef = useRef(false);
  const attemptRef = useRef(0);
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T>(
      action: () => T | Promise<T>,
    ): Promise<ReliableActionResult<T> | null> => {
      if (lockedRef.current) return null;

      lockedRef.current = true;
      setPending(true);
      const attempt = ++attemptRef.current;
      let timer: ReturnType<typeof setTimeout> | undefined;

      try {
        const submission = Promise.resolve(runWithPendingMutation(action)).then(
          (value) => ({ status: "settled" as const, value }),
        );
        const timeout = new Promise<{ status: "unconfirmed" }>((resolve) => {
          timer = setTimeout(
            () => resolve({ status: "unconfirmed" }),
            UNCONFIRMED_AFTER_MS,
          );
        });
        return await Promise.race([submission, timeout]);
      } finally {
        if (timer) clearTimeout(timer);
        if (attempt === attemptRef.current) {
          lockedRef.current = false;
          setPending(false);
        }
      }
    },
    [],
  );

  return { pending, run };
}
