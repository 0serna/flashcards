import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function loginWithMagicLinkError(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "magic_link_failed");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let error: { message: string } | null = null;

  try {
    if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code));
    } else if (tokenHash && type) {
      ({ error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      }));
    } else {
      return loginWithMagicLinkError(request);
    }

    if (error) {
      return loginWithMagicLinkError(request);
    }
  } catch {
    return loginWithMagicLinkError(request);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
