import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function loginWithGoogleError(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "google_sign_in_failed");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return loginWithGoogleError(request);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return loginWithGoogleError(request);
    }
  } catch {
    return loginWithGoogleError(request);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
