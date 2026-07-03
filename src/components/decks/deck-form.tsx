import type React from "react";
import Link from "next/link";

import { AppScreen } from "@/components/app-screen";
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
  const title = isEditing ? "Edit deck" : "Create deck";
  const actionLabel = isEditing ? "Save changes" : "Create deck";

  return (
    <form
      action={action}
      className="space-y-5 rounded-xl border border-border bg-background p-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Deck name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          placeholder="e.g. Spanish Basics"
          defaultValue={deck?.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="Optional note about what this deck is for"
          defaultValue={deck?.description ?? ""}
          className="flex min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <Button type="submit" className="w-full">
          {actionLabel}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href={isEditing && deck ? `/decks/${deck.id}` : "/"}>
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}

export function DeckFormShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <AppScreen contentClassName="py-4">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Home
      </Link>
      <header className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </AppScreen>
  );
}
