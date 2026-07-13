"use client";

import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ReliableForm } from "@/components/app/reliable-form";
import { Button } from "@/components/ui/button";
import type { MutationOutcome } from "@/lib/mutations/outcome";

export function ArchiveDeckForm({
  action,
}: {
  action: () =>
    | void
    | MutationOutcome<{ id: string }>
    | Promise<void | MutationOutcome<{ id: string }>>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <ReliableForm
      action={async () => {
        setError(null);
        const outcome = await action();
        if (outcome?.status === "rejected") {
          setError(outcome.message);
          return;
        }
        router.replace("/");
      }}
      onUnconfirmed={() =>
        setError("We could not confirm this action. Try again safely.")
      }
      data-archive-deck-form
    >
      <Button
        type="submit"
        variant="destructive"
        className="w-full justify-start"
      >
        <Archive aria-hidden="true" />
        Archive deck
      </Button>
      {error ? (
        <p className="p-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </ReliableForm>
  );
}
