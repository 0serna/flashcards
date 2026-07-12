import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const databaseUrl = process.env.SUPABASE_MIGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "SUPABASE_MIGRATION_DATABASE_URL is required to run drizzle-kit commands.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
