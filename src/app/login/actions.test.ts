import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithGoogle } from "./actions";
import { createClient } from "@/lib/supabase/server";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("signInWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({
        host: "flashcards.test",
        "x-forwarded-proto": "https",
      }),
    );
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("starts Google OAuth with the local auth callback", async () => {
    const signInWithOAuth = vi
      .fn()
      .mockResolvedValue({
        data: { url: "https://google.test/oauth" },
        error: null,
      });
    createClientMock.mockResolvedValue({
      auth: { signInWithOAuth },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(signInWithGoogle({ status: "idle" })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://flashcards.test/auth/callback",
      },
    });
    expect(mocks.redirect).toHaveBeenCalledWith("https://google.test/oauth");
  });

  it("returns a user-facing error when Supabase cannot start OAuth", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { url: null },
      error: new Error("temporarily unavailable"),
    });
    createClientMock.mockResolvedValue({
      auth: { signInWithOAuth },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const result = await signInWithGoogle({ status: "idle" });

    expect(result).toEqual({
      status: "error",
      message: "We could not start Google sign-in right now. Please try again.",
    });
  });
});
