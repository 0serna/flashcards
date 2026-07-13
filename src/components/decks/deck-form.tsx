"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { Breadcrumb } from "@/components/app/breadcrumb";
import type { BreadcrumbItem } from "@/components/app/breadcrumb-context";
import { GuardedLink } from "@/components/app/guarded-link";
import { markFormClean } from "@/components/app/dirty-form-store";
import { getPreviousAppPath } from "@/components/app/navigation-history-store";
import { useDirtyFormTracker } from "@/components/app/use-dirty-form-tracker";
import { useReliableAction } from "@/components/app/use-reliable-action";
import type { MutationOutcome } from "@/lib/mutations/outcome";
import { Button } from "@/components/ui/button";
import { FormActions, FormSurface } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DeckFormProps = {
  mode: "create" | "edit";
  action: (
    formData: FormData,
  ) =>
    | void
    | MutationOutcome<{ id: string }>
    | Promise<void | MutationOutcome<{ id: string }>>;
  deck?: {
    id: string;
    name: string;
    description: string | null;
    updatedAt?: string;
  };
};

export function DeckForm({ mode, action, deck }: DeckFormProps) {
  const isEditing = mode === "edit";
  const actionLabel = isEditing ? "Save changes" : "Create deck";
  const cancelHref = isEditing && deck ? `/decks/${deck.id}` : "/";
  const formRef = useDirtyFormTracker();
  const router = useRouter();
  const { pending: isPending, run } = useReliableAction();
  const [intentId] = useState(() => crypto.randomUUID());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitError(null);
    formData.set("intentId", intentId);
    if (isEditing && deck?.updatedAt) {
      formData.set("expectedUpdatedAt", deck.updatedAt);
    }
    void (async () => {
      try {
        const attempt = await run(() => action(formData));
        if (!attempt) return;
        if (attempt.status === "unconfirmed") {
          setSubmitError(
            "We could not confirm whether this was saved. Try again safely.",
          );
          return;
        }
        const outcome = attempt.value;
        if (outcome && outcome.status === "rejected") {
          setSubmitError(outcome.message);
          return;
        }

        markFormClean();
        if (!isEditing) {
          const id =
            outcome?.status === "confirmed" ? outcome.value.id : intentId;
          router.replace(`/decks/${id}/cards/new`);
          return;
        }

        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (getPreviousAppPath() === cancelHref) {
          router.back();
        } else {
          router.replace(cancelHref);
        }
      } catch {
        setSubmitError(
          "We could not confirm whether this was saved. Try again safely.",
        );
      }
    })();
  }

  return (
    <FormSurface
      ref={formRef}
      onSubmit={handleSubmit}
      aria-busy={isPending || undefined}
    >
      <input type="hidden" name="intentId" value={intentId} />
      {isEditing && deck?.updatedAt ? (
        <input type="hidden" name="expectedUpdatedAt" value={deck.updatedAt} />
      ) : null}
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
