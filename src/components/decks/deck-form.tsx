"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";

import { Breadcrumb } from "@/components/app/breadcrumb";
import type { BreadcrumbItem } from "@/components/app/breadcrumb-context";
import { GuardedLink } from "@/components/app/guarded-link";
import { markFormClean } from "@/components/app/dirty-form-store";
import { getPreviousAppPath } from "@/components/app/navigation-history-store";
import { useDirtyFormTracker } from "@/components/app/use-dirty-form-tracker";
import { runWithPendingMutation } from "@/lib/navigation/pending-mutations";
import { Button } from "@/components/ui/button";
import { FormActions, FormSurface } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DeckFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  deck?: {
    id: string;
    name: string;
    description: string | null;
  };
};

export function DeckForm({ mode, action, deck }: DeckFormProps) {
  const isEditing = mode === "edit";
  const actionLabel = isEditing ? "Save changes" : "Create deck";
  const cancelHref = isEditing && deck ? `/decks/${deck.id}` : "/";
  const formRef = useDirtyFormTracker();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitError(null);
    startTransition(async () => {
      try {
        await runWithPendingMutation(() => action(formData));
        if (isEditing) {
          markFormClean();
          setSuccess(true);
          await new Promise((resolve) => setTimeout(resolve, 800));
          if (getPreviousAppPath() === cancelHref) {
            router.back();
          } else {
            router.replace(cancelHref);
          }
        }
        // create mode: server redirect handles navigation on success
      } catch {
        setSubmitError(
          isEditing
            ? "Could not save the deck. Try again."
            : "Could not create the deck. Try again.",
        );
      }
    });
  }

  return (
    <FormSurface ref={formRef} onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="deck-name">Deck name</Label>
        <Input
          id="deck-name"
          name="name"
          required
          maxLength={120}
          placeholder="e.g. Spanish Basics"
          defaultValue={deck?.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deck-description">Description</Label>
        <Textarea
          id="deck-description"
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Optional note about what this deck is for"
          defaultValue={deck?.description ?? ""}
        />
      </div>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <FormActions>
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? "Saving…" : success ? "Saved!" : actionLabel}
        </Button>
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <GuardedLink href={cancelHref} replace>
            Cancel
          </GuardedLink>
        </Button>
      </FormActions>
    </FormSurface>
  );
}

type DeckFormShellProps = {
  breadcrumbItems: BreadcrumbItem[];
  children: React.ReactNode;
};

export function DeckFormShell({
  breadcrumbItems,
  children,
}: DeckFormShellProps) {
  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      {children}
    </>
  );
}
