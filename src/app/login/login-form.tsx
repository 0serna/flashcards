"use client";

import { useActionState, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = { status: "idle" };

type LoginFormProps = {
  authErrorMessage?: string;
};

export function LoginForm({ authErrorMessage }: LoginFormProps = {}) {
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
        className="flex w-full max-w-md flex-col items-center gap-6 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <Logo className="text-xl" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Check your email
            </h1>
            <p className="text-sm leading-6 text-muted-foreground text-pretty">
              We sent a secure sign-in link to{" "}
              <span className="font-medium text-foreground">{sentEmail}</span>.
              Open it on this device to continue.
            </p>
          </div>
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
    <form action={action} className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="text-xl" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Sign in
          </h1>
          <p className="text-sm leading-6 text-muted-foreground text-pretty">
            We’ll email you a sign-in link.
          </p>
        </div>
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
          className="bg-background"
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

      {authErrorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {authErrorMessage}
        </p>
      ) : null}

      {state.status === "error" && !emailError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="w-full"
          onClick={() => setEditingEmail(false)}
        >
          {pending ? "Sending…" : "Send sign-in link"}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          No password needed.
        </p>
      </div>
    </form>
  );
}
