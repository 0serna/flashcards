"use client";

import Link, { type LinkProps } from "next/link";
import type React from "react";

import { isPendingMutation } from "@/lib/navigation/pending-mutations";

import {
  isFormDirty,
  markFormClean,
  UNSAVED_CHANGES_MESSAGE,
} from "./dirty-form-store";
import { announceNavigationStart } from "./navigation-loading";

const DEFAULT_MESSAGE = UNSAVED_CHANGES_MESSAGE;

type AnchorAttrs = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export type GuardedLinkProps = LinkProps &
  Omit<AnchorAttrs, keyof LinkProps> & {
    message?: string;
    /**
     * Skip the guard even when the form is dirty. The store is still
     * cleared on navigation so the next mount starts fresh.
     */
    bypassDirtyCheck?: boolean;
  };

/**
 * `next/link` replacement that consults the dirty-form store before
 * navigating. The click handler always reads the live store so it stays
 * accurate between renders; after a confirmed navigation the store is reset
 * so the next form mount starts with a clean state.
 */
export function GuardedLink({
  message = DEFAULT_MESSAGE,
  bypassDirtyCheck = false,
  onClick,
  children,
  ...rest
}: GuardedLinkProps) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isPendingMutation()) {
      event.preventDefault();
      return;
    }
    if (!bypassDirtyCheck && isFormDirty()) {
      const confirmed = window.confirm(message);
      if (!confirmed) {
        event.preventDefault();
        return;
      }
    }
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (isFormDirty()) {
      markFormClean();
    }
    announceNavigationStart();
  }

  return (
    <Link {...rest} data-navigation-guarded="true" onClick={handleClick}>
      {children}
    </Link>
  );
}
