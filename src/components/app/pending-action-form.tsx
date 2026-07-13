"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import type { MutationOutcome } from "@/lib/mutations/outcome";
import { ReliableForm } from "./reliable-form";

type PendingActionFormProps = {
  action: (
    formData: FormData,
  ) =>
    | void
    | MutationOutcome<{ id: string }>
    | Promise<void | MutationOutcome<{ id: string }>>;
  children: ReactNode;
  className?: string;
  successHref?: string;
};

export function PendingActionForm({
  action,
  children,
  className,
  successHref,
}: PendingActionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <ReliableForm
      action={async (formData) => {
        setError(null);
        const outcome = await action(formData);
        if (outcome?.status === "rejected") {
          setError(outcome.message);
          return;
        }
        if (successHref) router.replace(successHref);
        else router.refresh();
      }}
      onUnconfirmed={() =>
        setError("We could not confirm this action. Try again safely.")
      }
      className={className}
    >
      {children}
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </ReliableForm>
  );
}
