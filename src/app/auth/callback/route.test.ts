import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

function request(url: string) {
  return new NextRequest(url);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("exchanges a Supabase auth code and redirects to the app", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request("http://localhost:3000/auth/callback?code=abc123"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects to login with a Google sign-in error when the code is missing", async () => {
    const exchangeCodeForSession = vi.fn();
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(request("http://localhost:3000/auth/callback"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=google_sign_in_failed",
    );
  });

  it("redirects to login with a Google sign-in error when the code is invalid", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      error: new Error("invalid code"),
    });
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request("http://localhost:3000/auth/callback?code=invalid"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=google_sign_in_failed",
    );
  });

  it("redirects to login with a Google sign-in error when exchange throws", async () => {
    const exchangeCodeForSession = vi
      .fn()
      .mockRejectedValue(new Error("missing code verifier"));
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request("http://localhost:3000/auth/callback?code=abc123"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=google_sign_in_failed",
    );
  });

  it("redirects to login with a Google sign-in error when the auth client cannot be created", async () => {
    createClientMock.mockRejectedValue(new Error("missing Supabase config"));

    const response = await GET(
      request("http://localhost:3000/auth/callback?code=abc123"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=google_sign_in_failed",
    );
  });
});
