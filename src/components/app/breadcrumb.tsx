import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { GuardedLink } from "./guarded-link";
import type { BreadcrumbProps } from "./breadcrumb-context";

/**
 * Responsive contextual navigation for authenticated views.
 *
 * - The current (last) item is always rendered as non-clickable text with
 *   `aria-current="page"`.
 * - On wide screens the full path is visible: `Home / Parent / Current`.
 * - On narrow screens only the immediate parent and the current item are
 *   shown. The parent link is given a left-arrow affordance and the rest
 *   of the path is collapsed.
 *
 * Long dynamic labels (typically Deck names) are truncated visually but
 * keep their full accessible name.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const lastIndex = items.length - 1;
  const isCurrentIndex = (i: number) => i === lastIndex;
  const isParentIndex = (i: number) => i === lastIndex - 1;

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const isCurrent = isCurrentIndex(index);
          const isParent = isParentIndex(index);
          // Items other than the immediate parent and the current view are
          // only visible on wider viewports.
          const hiddenOnMobile = !isCurrent && !isParent;

          if (isCurrent) {
            return (
              <li
                key={`${item.label}-${index}`}
                className="flex min-w-0 items-center"
              >
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground"
                >
                  {item.label}
                </span>
              </li>
            );
          }

          const linkClass = cn(
            "flex min-w-0 items-center gap-1 truncate rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            hiddenOnMobile && "hidden md:flex",
          );

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {item.href ? (
                <GuardedLink href={item.href} replace className={linkClass}>
                  {isParent ? (
                    <ChevronLeft
                      aria-hidden="true"
                      className="size-4 shrink-0 md:hidden"
                    />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </GuardedLink>
              ) : (
                <span className={cn(linkClass, "cursor-default")}>
                  {item.label}
                </span>
              )}
              {!isCurrent ? (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground/70"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
