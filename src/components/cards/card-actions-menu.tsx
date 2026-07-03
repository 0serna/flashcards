"use client";

import { Archive, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function CardActionsMenu({
  deckId,
  cardId,
  archiveAction,
}: {
  deckId: string;
  cardId: string;
  archiveAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = `card-actions-${cardId}`;

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
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
        type="button"
        variant="ghost"
        size="icon"
        aria-label="More card actions"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal aria-hidden="true" />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="group"
          aria-label="Card actions"
          className="absolute right-0 top-12 z-10 w-52 space-y-1 rounded-xl border border-border bg-background p-1 shadow-sm"
        >
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href={`/decks/${deckId}/cards/${cardId}/edit`}>
              <Pencil aria-hidden="true" />
              Edit card
            </Link>
          </Button>
          <form action={archiveAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start"
            >
              <Archive aria-hidden="true" />
              Archive card
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
