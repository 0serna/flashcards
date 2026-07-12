"use client";

import Image from "next/image";
import { RefreshCcw } from "lucide-react";
import { useId, useReducer } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PrivateCardImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

type State =
  | { kind: "loading"; attempt: number }
  | { kind: "ready"; attempt: number }
  | { kind: "unavailable"; attempt: number };

type Action = { type: "loaded" } | { type: "failed" } | { type: "retry" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loaded":
      return { kind: "ready", attempt: state.attempt };
    case "failed":
      return { kind: "unavailable", attempt: state.attempt };
    case "retry":
      return { kind: "loading", attempt: state.attempt + 1 };
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PrivateCardImage({
  src,
  alt,
  width,
  height,
  className,
}: PrivateCardImageProps) {
  const [state, dispatch] = useReducer(reducer, {
    kind: "loading",
    attempt: 0,
  });
  const labelId = useId();
  const statusId = useId();
  const reducedMotion = prefersReducedMotion();

  return (
    <div
      className="flex w-full justify-center"
      data-private-card-image=""
      data-state={state.kind}
      aria-labelledby={labelId}
      aria-describedby={state.kind === "unavailable" ? statusId : undefined}
    >
      <span id={labelId} className="sr-only">
        {alt}
      </span>
      {state.kind === "loading" ? (
        <div
          data-private-card-image-placeholder=""
          data-reduced-motion={reducedMotion ? "true" : "false"}
          role="status"
          aria-live="polite"
          className={cn(
            "flex h-52 w-full items-center justify-center rounded-lg border border-border bg-muted/60 text-sm text-muted-foreground sm:h-64",
            !reducedMotion && "animate-pulse motion-reduce:animate-none",
          )}
        >
          <span>Loading image</span>
          <span className="sr-only">: {alt}</span>
        </div>
      ) : null}
      {state.kind !== "unavailable" ? (
        // Keyed on attempt so a retry remounts the underlying image and
        // forces a fresh network request without changing the source.
        <Image
          key={state.attempt}
          src={src}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          loading="eager"
          onLoad={() => dispatch({ type: "loaded" })}
          onError={() => dispatch({ type: "failed" })}
          className={cn(
            "h-auto max-h-52 w-auto max-w-full rounded-lg border border-border object-contain sm:max-h-64",
            className,
          )}
        />
      ) : null}
      {state.kind === "unavailable" ? (
        <div
          data-private-card-image-unavailable=""
          role="alert"
          className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground sm:h-64"
        >
          <p id={statusId}>Image unavailable</p>
          <span className="sr-only">: {alt}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => dispatch({ type: "retry" })}
          >
            <RefreshCcw aria-hidden="true" />
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
