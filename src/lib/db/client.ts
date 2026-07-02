import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

let cached: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!databaseUrl) {
    throw new Error(
      "SUPABASE_DATABASE_URL is required to use the server database client.",
    );
  }
  if (!cached) {
    const client = postgres(databaseUrl, { prepare: false });
    cached = drizzle(client, { schema });
  }
  return cached;
}
