"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export type ErrorRecoveryProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

/**
 * The content shared by the route-level error boundary and the global
 * error boundary. Each consumer wraps it in its own shell so the visual
 * frame matches the rest of the app while the message stays consistent.
 */
export function ErrorRecovery({ error, unstable_retry }: ErrorRecoveryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="w-full rounded-xl border border-border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        This page couldn’t recover on its own.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Try again to reload this part of the app. If it keeps happening, go back
        home and continue from there.
      </p>
      {error.digest ? (
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Error reference:{" "}
          <span className="select-all font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <form
          action="/auth/recover"
          method="post"
          onSubmit={(event) => {
            const form = event.currentTarget;
            if (form.getAttribute("aria-busy") === "true") {
              event.preventDefault();
              return;
            }
            form.setAttribute("aria-busy", "true");
            const button = form.querySelector("button");
            if (button) button.disabled = true;
          }}
        >
          <Button className="w-full" type="submit" variant="outline">
            Sign out and return to login
          </Button>
        </form>
      </div>
    </section>
  );
}
