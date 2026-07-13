import { AccountMenu } from "@/components/account-menu";
import { LogoMark } from "@/components/logo";

import { GuardedLink } from "./guarded-link";
import { ReleaseUpdateButton } from "./release-update-button";

type HeaderProps = {
  signOutAction: () => void | Promise<void>;
};

/**
 * Shared global header for every authenticated view.
 *
 * - Logo links to `/` and is wrapped in `GuardedLink` so that leaving a
 *   dirty form prompts for confirmation.
 * - Account menu uses the existing `signOutAction` unchanged.
 * - Renders inline at the top of `AppScreen`; it is not sticky and does
 *   not introduce a primary navigation layer beyond the existing Home
 *   link and account menu.
 * - The `Update` action sits directly after the logo and before the
 *   account menu. It is only visible when the active release differs
 *   from the loaded one.
 */
export function Header({ signOutAction }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <GuardedLink
          href="/"
          replace
          aria-label="Flashcards home"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-1 text-base font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <LogoMark aria-hidden="true" className="size-[1.5em] shrink-0" />
          <span>Flashcards</span>
        </GuardedLink>
        <ReleaseUpdateButton />
      </div>
      <AccountMenu signOutAction={signOutAction} />
    </header>
  );
}
