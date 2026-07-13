import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/decks/service";

export async function requireUserId() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");
  return user.id;
}
