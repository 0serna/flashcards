"use client";

import {
  useRef,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";

import { runWithPendingMutation } from "@/lib/navigation/pending-mutations";

const UNCONFIRMED_AFTER_MS = 15_000;

type ReliableFormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action" | "onSubmit" | "children"
> & {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  onUnconfirmed?: () => void;
};

export function ReliableForm({
  action,
  children,
  onUnconfirmed,
  ...props
}: ReliableFormProps) {
  const lockedRef = useRef(false);
  const attemptRef = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lockedRef.current) return;

    const form = event.currentTarget;
    const attempt = ++attemptRef.current;
    lockedRef.current = true;
    setFormLocked(form, true);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<"unconfirmed">((resolve) => {
      timer = setTimeout(() => resolve("unconfirmed"), UNCONFIRMED_AFTER_MS);
    });

    try {
      const submission = Promise.resolve(
        runWithPendingMutation(() => action(new FormData(form))),
      ).then(() => "settled" as const);
      const result = await Promise.race([submission, timeout]);
      if (attempt !== attemptRef.current) return;
      if (result === "unconfirmed") onUnconfirmed?.();
    } finally {
      if (timer) clearTimeout(timer);
      if (attempt === attemptRef.current) {
        lockedRef.current = false;
        setFormLocked(form, false);
      }
    }
  }

  return (
    <form {...props} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

function setFormLocked(form: HTMLFormElement, locked: boolean) {
  if (locked) form.setAttribute("aria-busy", "true");
  else form.removeAttribute("aria-busy");

  for (const control of form.querySelectorAll<
    HTMLButtonElement | HTMLInputElement
  >('button[type="submit"], input[type="submit"]')) {
    if (locked) {
      control.dataset.reliableFormWasDisabled = String(control.disabled);
      control.disabled = true;
    } else {
      control.disabled = control.dataset.reliableFormWasDisabled === "true";
      delete control.dataset.reliableFormWasDisabled;
    }
  }
}
