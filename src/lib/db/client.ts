import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.SUPABASE_RUNTIME_DATABASE_URL;

let cached: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!databaseUrl) {
    throw new Error(
      "SUPABASE_RUNTIME_DATABASE_URL is required to use the server database client.",
    );
  }
  if (!cached) {
    const client = postgres(databaseUrl, {
      connect_timeout: 10,
      idle_timeout: 20,
      max: 1,
      max_lifetime: 300,
      prepare: false,
    });
    cached = drizzle(client, { schema });
  }
  return cached;
}
