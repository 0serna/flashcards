import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { GuardedLink } from "./guarded-link";
import type { BreadcrumbProps } from "./breadcrumb-context";

/**
 * Contextual navigation for authenticated views.
 *
 * - The current (last) item is always rendered as non-clickable text with
 *   `aria-current="page"`.
 * - The full path is shown on every viewport: `Home / Parent / Current`.
 *
 * Long dynamic labels (typically Deck names) are truncated visually but
 * keep their full accessible name.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const lastIndex = items.length - 1;

  return (
    <nav aria-label="Breadcrumb" className="mb-2 text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const isCurrent = index === lastIndex;

          if (isCurrent) {
            return (
              <li
                key={`${item.label}-${index}`}
                className="flex min-w-0 items-center"
              >
                <span
                  aria-current="page"
                  className="flex min-h-9 min-w-0 items-center truncate font-medium text-foreground"
                >
                  {item.label}
                </span>
              </li>
            );
          }

          const linkClass =
            "flex min-h-9 min-w-0 items-center gap-1 truncate rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {item.href ? (
                <GuardedLink href={item.href} replace className={linkClass}>
                  <span className="truncate">{item.label}</span>
                </GuardedLink>
              ) : (
                <span className={cn(linkClass, "cursor-default")}>
                  {item.label}
                </span>
              )}
              <ChevronRight
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground/70"
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
