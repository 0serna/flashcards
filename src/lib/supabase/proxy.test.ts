import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSession } from "./proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

function request(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

function mockClaims(claims: unknown) {
  createServerClientMock.mockReturnValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: { claims } }),
    },
  } as unknown as ReturnType<typeof createServerClient>);
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
  });

  it("redirects an unauthenticated visitor from the app root to login", async () => {
    mockClaims(null);

    const response = await updateSession(request("/"));

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });

  it("allows an unauthenticated visitor to open login", async () => {
    mockClaims(null);

    const response = await updateSession(request("/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows Supabase to open confirmation without an existing session", async () => {
    mockClaims(null);

    const response = await updateSession(request("/auth/confirm"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows an authenticated user to open the app root", async () => {
    mockClaims({ sub: "user-1" });

    const response = await updateSession(request("/"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an authenticated user away from login", async () => {
    mockClaims({ sub: "user-1" });

    const response = await updateSession(request("/login"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });
});
