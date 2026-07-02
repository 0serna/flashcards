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

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("exchanges a Supabase auth code and redirects to the app", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request("http://localhost:3000/auth/confirm?code=abc123"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("verifies a token hash and redirects to the app", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { verifyOtp },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request(
        "http://localhost:3000/auth/confirm?token_hash=hash123&type=email",
      ),
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      type: "email",
      token_hash: "hash123",
    });
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects to login with an explanation when confirmation fails", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      error: new Error("invalid code"),
    });
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request("http://localhost:3000/auth/confirm?code=invalid"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=magic_link_failed",
    );
  });

  it("redirects to login with an explanation when confirmation throws", async () => {
    const exchangeCodeForSession = vi
      .fn()
      .mockRejectedValue(new Error("missing code verifier"));
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await GET(
      request("http://localhost:3000/auth/confirm?code=abc123"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=magic_link_failed",
    );
  });
});
