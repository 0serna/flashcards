import type React from "react";

import { cn } from "@/lib/utils";

import { Header } from "./app/header";
import { NavigationHistoryTracker } from "./app/navigation-history-tracker";

type AppScreenProps = {
  children: React.ReactNode;
  contentClassName?: string;
  /**
   * When provided, renders the shared authenticated header (logo + account
   * menu) at the top of the screen. Pass `signOutAction` from the auth
   * actions; the same action is used everywhere. Login and global error
   * surfaces do not pass this prop, so they stay outside the shell.
   */
  signOutAction?: () => void | Promise<void>;
  /**
   * Override the default reading-width constraint. Defaults to `max-w-md`.
   * List/detail screens can widen to `max-w-2xl` for better desktop density
   * while forms and Study keep the narrower measure.
   */
  maxWidthClass?: string;
};

export function AppScreen({
  children,
  contentClassName,
  signOutAction,
  maxWidthClass = "max-w-md",
}: AppScreenProps) {
  return (
    <main className="min-h-svh bg-secondary/30 px-4 py-4 text-foreground">
      <div
        className={cn(
          "mx-auto flex min-h-[calc(100svh-2rem)] w-full flex-col",
          maxWidthClass,
        )}
      >
        {signOutAction ? (
          <>
            <NavigationHistoryTracker />
            <Header signOutAction={signOutAction} />
          </>
        ) : null}
        <div className={cn("flex min-h-0 flex-1 flex-col", contentClassName)}>
          {children}
        </div>
      </div>
    </main>
  );
}
