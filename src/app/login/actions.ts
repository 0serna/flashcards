"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState =
  { status: "idle" } | { status: "error"; message: string };

async function resolveOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  if (forwardedHost) return `${protocol}://${forwardedHost}`;
  if (host) return `${protocol}://${host}`;
  return "http://localhost:3000";
}

export async function signInWithGoogle(
  _previous: LoginActionState,
): Promise<LoginActionState> {
  const supabase = await createClient();
  const redirectTo = `${await resolveOrigin()}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    return {
      status: "error",
      message: "We could not start Google sign-in right now. Please try again.",
    };
  }

  redirect(data.url);
}
