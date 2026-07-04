"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export type ErrorRecoveryProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export function ErrorRecovery({ error, unstable_retry }: ErrorRecoveryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          This page couldn’t recover on its own.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Try again to reload this part of the app. If it keeps happening, go
          back home and continue from there.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Error reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => unstable_retry()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
