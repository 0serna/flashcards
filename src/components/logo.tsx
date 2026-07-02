import Link from "next/link";

import logoGeometry from "@/brand/logo-geometry.json";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  label?: string;
  showWordmark?: boolean;
};

export function Logo({
  className,
  href = "/",
  label,
  showWordmark = true,
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={showWordmark ? undefined : label}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md px-1 font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    >
      <LogoMark aria-hidden="true" className="size-[1.5em] shrink-0" />
      {showWordmark ? <span>{label ?? "Flashcards"}</span> : null}
    </Link>
  );
}

type LogoMarkProps = {
  className?: string;
  "aria-hidden"?: "true";
};

export function LogoMark(props: LogoMarkProps) {
  return (
    <svg viewBox={logoGeometry.viewBox} fill="none" {...props}>
      {logoGeometry.paths.map((path) => (
        <path
          key={path}
          d={path}
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
