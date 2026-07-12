import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  drizzle: vi.fn(() => ({ kind: "db" })),
  postgres: vi.fn(() => ({ kind: "client" })),
}));

vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: mocks.drizzle }));
vi.mock("postgres", () => ({ default: mocks.postgres }));

describe("getDb", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.SUPABASE_RUNTIME_DATABASE_URL =
      "postgres://runtime.example:6543/postgres";
  });

  afterEach(() => {
    delete process.env.SUPABASE_RUNTIME_DATABASE_URL;
  });

  it("uses a bounded serverless connection pool", async () => {
    const { getDb } = await import("./client");

    getDb();

    expect(mocks.postgres).toHaveBeenCalledWith(
      "postgres://runtime.example:6543/postgres",
      {
        connect_timeout: 10,
        idle_timeout: 20,
        max: 1,
        max_lifetime: 300,
        prepare: false,
      },
    );
  });

  it("requires the runtime database URL", async () => {
    delete process.env.SUPABASE_RUNTIME_DATABASE_URL;
    const { getDb } = await import("./client");

    expect(() => getDb()).toThrow(
      "SUPABASE_RUNTIME_DATABASE_URL is required to use the server database client.",
    );
  });
});
