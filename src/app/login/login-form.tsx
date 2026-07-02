"use client";

import { useActionState, useState } from "react";

import { Logo } from "@/components/logo";
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
  const [editingEmail, setEditingEmail] = useState(false);

  const emailError =
    state.status === "error" ? state.fieldErrors?.email?.[0] : undefined;
  const emailErrorId = emailError ? "email-error" : undefined;
  const sentEmail = state.status === "success" ? state.email : undefined;
  const showSuccess = state.status === "success" && !editingEmail;

  if (showSuccess && sentEmail) {
    return (
      <div
        aria-live="polite"
        className="flex w-full max-w-sm flex-col items-center gap-5 text-center"
      >
        <div className="flex flex-col items-center gap-2">
          <Logo className="text-sm" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a secure sign-in link to{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>.
            Open it on this device to continue.
          </p>
        </div>

        <form action={action} className="flex w-full flex-col gap-3">
          <input type="hidden" name="email" value={sentEmail} />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Resend sign-in link"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setEditingEmail(true)}
          >
            Use a different email
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="text-sm" />
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a secure sign-in link.
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
          defaultValue={sentEmail}
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

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
        onClick={() => setEditingEmail(false)}
      >
        {pending ? "Sending…" : "Send sign-in link"}
      </Button>
    </form>
  );
}
