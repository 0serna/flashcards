import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestMagicLink } from "./actions";
import { createClient } from "@/lib/supabase/server";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

function emailFormData(email?: string) {
  const formData = new FormData();
  if (email !== undefined) formData.set("email", email);
  return formData;
}

describe("requestMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({
        host: "flashcards.test",
        "x-forwarded-proto": "https",
      }),
    );
  });

  it("requests a Magic Link for a valid email", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { signInWithOtp },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const result = await requestMagicLink(
      { status: "idle" },
      emailFormData("User@Example.com"),
    );

    expect(result).toEqual({ status: "success", email: "user@example.com" });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        emailRedirectTo: "https://flashcards.test/auth/confirm",
        shouldCreateUser: true,
      },
    });
  });

  it("rejects an invalid email without calling Supabase Auth", async () => {
    const result = await requestMagicLink(
      { status: "idle" },
      emailFormData("not-an-email"),
    );

    expect(result.status).toBe("error");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns a user-facing error when Supabase cannot send the link", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({
      error: new Error("temporarily unavailable"),
    });
    createClientMock.mockResolvedValue({
      auth: { signInWithOtp },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const result = await requestMagicLink(
      { status: "idle" },
      emailFormData("user@example.com"),
    );

    expect(result).toEqual({
      status: "error",
      message:
        "We could not send the sign-in link right now. Please try again.",
    });
  });

  it("explains when Supabase has rate-limited email delivery", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({
      error: { code: "over_email_send_rate_limit" },
    });
    createClientMock.mockResolvedValue({
      auth: { signInWithOtp },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const result = await requestMagicLink(
      { status: "idle" },
      emailFormData("user@example.com"),
    );

    expect(result).toEqual({
      status: "error",
      message:
        "Too many sign-in links were requested. Please wait a few minutes before trying again.",
    });
  });
});
