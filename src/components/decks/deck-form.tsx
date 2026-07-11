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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        await action(formData);
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
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-border bg-background p-4"
    >
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
        <textarea
          id="deck-description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="Optional note about what this deck is for"
          defaultValue={deck?.description ?? ""}
          className="flex min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving…" : success ? "Saved!" : actionLabel}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <GuardedLink href={cancelHref} replace>
            Cancel
          </GuardedLink>
        </Button>
      </div>
    </form>
  );
}

type DeckFormShellProps = {
  title: string;
  description: string;
  breadcrumbItems: BreadcrumbItem[];
  children: React.ReactNode;
};

export function DeckFormShell({
  title,
  description,
  breadcrumbItems,
  children,
}: DeckFormShellProps) {
  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <header className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </>
  );
}
