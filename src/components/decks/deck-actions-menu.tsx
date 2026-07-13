"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ArchiveDeckForm } from "@/components/decks/archive-deck-form";
import { Button } from "@/components/ui/button";
import type { MutationOutcome } from "@/lib/mutations/outcome";

export function DeckActionsMenu({
  deckId,
  archiveAction,
}: {
  deckId: string;
  archiveAction: () =>
    | void
    | MutationOutcome<{ id: string }>
    | Promise<void | MutationOutcome<{ id: string }>>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = `deck-actions-${deckId}`;

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="icon"
        aria-label="More deck actions"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal aria-hidden="true" />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="group"
          aria-label="Deck actions"
          className="absolute right-0 top-12 z-10 w-52 space-y-1 rounded-xl border border-border bg-background p-1 shadow-sm"
        >
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link href={`/decks/${deckId}/edit`}>
              <Pencil aria-hidden="true" />
              Edit deck
            </Link>
          </Button>
          <ArchiveDeckForm action={archiveAction} />
        </div>
      ) : null}
    </div>
  );
}
