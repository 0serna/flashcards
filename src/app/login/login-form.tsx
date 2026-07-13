"use client";

import { useActionState, useEffect, useRef } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = { status: "idle" };

type LoginFormProps = {
  authErrorMessage?: string;
};

export function LoginForm({ authErrorMessage }: LoginFormProps = {}) {
  const [state, action, pending] = useActionState(
    signInWithGoogle,
    initialState,
  );
  const lockedRef = useRef(false);

  useEffect(() => {
    if (!pending) lockedRef.current = false;
  }, [pending]);

  return (
    <form
      action={action}
      className="flex w-full max-w-md flex-col gap-6"
      aria-busy={pending || undefined}
      onSubmit={(event) => {
        if (lockedRef.current) {
          event.preventDefault();
          return;
        }
        lockedRef.current = true;
      }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="text-xl" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Sign in
          </h1>
          <p className="text-sm leading-6 text-muted-foreground text-pretty">
            Continue with your Google account to open your decks.
          </p>
        </div>
      </div>

      {authErrorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {authErrorMessage}
        </p>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Redirecting…" : "Continue with Google"}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          No password needed.
        </p>
      </div>
    </form>
  );
}
