"use client";

import { LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ReliableForm } from "@/components/app/reliable-form";
import { Button } from "@/components/ui/button";

export function AccountMenu({
  signOutAction,
}: {
  signOutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = "account-menu";

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
        aria-label="Account menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Settings aria-hidden="true" />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="group"
          aria-label="Account actions"
          className="absolute right-0 top-12 z-10 w-52 space-y-1 rounded-xl border border-border bg-background p-1 shadow-sm"
        >
          <ReliableForm action={signOutAction}>
            <Button
              type="submit"
              variant="secondary"
              className="w-full justify-start"
            >
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </ReliableForm>
        </div>
      ) : null}
    </div>
  );
}
