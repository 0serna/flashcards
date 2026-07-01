"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = { status: "idle" };

export function LoginForm() {
  const [state, action, pending] = useActionState(
    requestMagicLink,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          We sent you a Magic Link. Open it on this device to sign in to
          Flashcards.
        </p>
      </div>
    );
  }

  const emailError =
    state.status === "error" ? state.fieldErrors?.email?.[0] : undefined;
  const emailErrorId = emailError ? "email-error" : undefined;

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a Magic Link to sign in.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="you@example.com"
          aria-invalid={emailError ? "true" : undefined}
          aria-describedby={emailErrorId}
        />
        {emailError ? (
          <p
            id={emailErrorId}
            role="alert"
            className="text-sm text-destructive"
          >
            {emailError}
          </p>
        ) : null}
      </div>

      {state.status === "error" && !emailError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send Magic Link"}
      </Button>
    </form>
  );
}
