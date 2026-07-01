"use client";

import { useActionState } from "react";
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
        <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          We sent you a Magic Link. Open it on this device to sign in to
          Flashcards.
        </p>
      </div>
    );
  }

  const emailError =
    state.status === "error" ? state.fieldErrors?.email?.[0] : undefined;

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter your email and we&apos;ll send you a Magic Link to sign in.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          placeholder="you@example.com"
        />
        {emailError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>
        ) : null}
      </div>

      {state.status === "error" && !emailError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Sending…" : "Send Magic Link"}
      </button>
    </form>
  );
}
