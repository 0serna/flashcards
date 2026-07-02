import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL is required to run drizzle-kit commands.",
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
