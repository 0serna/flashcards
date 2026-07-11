import { AccountMenu } from "@/components/account-menu";
import { LogoMark } from "@/components/logo";

import { GuardedLink } from "./guarded-link";

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
 */
export function Header({ signOutAction }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-2">
      <GuardedLink
        href="/"
        replace
        aria-label="Flashcards home"
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-base font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <LogoMark aria-hidden="true" className="size-[1.5em] shrink-0" />
        <span>Flashcards</span>
      </GuardedLink>
      <AccountMenu signOutAction={signOutAction} />
    </header>
  );
}
