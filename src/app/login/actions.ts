"use server";

import { headers } from "next/headers";
import { emailSchema } from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string; fieldErrors?: { email?: string[] } };

async function resolveOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  if (forwardedHost) return `${protocol}://${forwardedHost}`;
  if (host) return `${protocol}://${host}`;
  return "http://localhost:3000";
}

export async function requestMagicLink(
  _previous: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const emailRedirectTo = `${await resolveOrigin()}/auth/confirm`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    if ("code" in error && error.code === "over_email_send_rate_limit") {
      return {
        status: "error",
        message:
          "Too many sign-in links were requested. Please wait a few minutes before trying again.",
      };
    }

    return {
      status: "error",
      message:
        "We could not send the sign-in link right now. Please try again.",
    };
  }

  return { status: "success", email: parsed.data.email };
}
