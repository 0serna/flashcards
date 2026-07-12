import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-") && name.includes("auth-token");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    console.error("Failed to complete remote recovery sign-out", error);
  } finally {
    const cookieStore = await cookies();
    for (const { name } of cookieStore.getAll()) {
      if (isSupabaseAuthCookie(name)) cookieStore.delete(name);
    }
  }

  return NextResponse.redirect(new URL("/login", request.url), 303);
}
