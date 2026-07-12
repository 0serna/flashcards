import { Suspense } from "react";
import type React from "react";

import { cn } from "@/lib/utils";

import { Header } from "./app/header";
import { NavigationHistoryTracker } from "./app/navigation-history-tracker";
import { NavigationLoading } from "./app/navigation-loading";

type AppScreenVariant = "fill" | "centered";

type AppScreenProps = {
  children: React.ReactNode;
  contentClassName?: string;
  /**
   * When provided, renders the shared authenticated header (logo + account
   * menu) at the top of the screen. Pass `signOutAction` from the auth
   * actions; the same action is used everywhere. Login and global error
   * surfaces omit this prop so they stay outside the shell.
   */
  signOutAction?: () => void | Promise<void>;
  /**
   * Layout shape of the inner shell.
   * - `fill` (default): header at the top, content fills the remaining
   *   viewport. Use for authenticated screens.
   * - `centered`: no header, content vertically and horizontally centered.
   *   Use for login and error recovery surfaces.
   */
  variant?: AppScreenVariant;
};

/**
 * The single layout shell every screen renders inside.
 *
 * It enforces the same reading width, padding, and background across the
 * app so current and future views stay aligned. The shell exposes a
 * `variant` to opt into a centered surface (login, error) without opting
 * out of the global constraints.
 */
export function AppScreen({
  children,
  contentClassName,
  signOutAction,
  variant = "fill",
}: AppScreenProps) {
  const isCentered = variant === "centered";

  return (
    <main className="flex min-h-svh flex-col bg-secondary/30 px-4 py-4 text-foreground">
      <div
        data-app-shell="true"
        className={cn(
          "mx-auto flex w-full max-w-md flex-col",
          isCentered
            ? "min-h-svh items-center justify-center"
            : "min-h-[calc(100svh-2rem)]",
        )}
      >
        {signOutAction && !isCentered ? (
          <>
            <NavigationHistoryTracker />
            <Suspense fallback={null}>
              <NavigationLoading />
            </Suspense>
            <Header signOutAction={signOutAction} />
          </>
        ) : null}
        <div
          data-app-content="true"
          className={cn(
            isCentered
              ? "flex w-full flex-col"
              : "flex min-h-0 flex-1 flex-col",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
