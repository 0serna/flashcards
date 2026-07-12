import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const createClientMock = vi.mocked(createClient);
const cookiesMock = vi.mocked(cookies);

function mockCookieStore() {
  const store = {
    delete: vi.fn(),
    getAll: vi.fn(() => [
      { name: "sb-project-auth-token", value: "token" },
      { name: "theme", value: "dark" },
    ]),
  };
  cookiesMock.mockResolvedValue(
    store as unknown as Awaited<ReturnType<typeof cookies>>,
  );
  return store;
}

describe("POST /auth/recover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ends the local session, clears local auth cookies, and redirects", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { signOut },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const cookieStore = mockCookieStore();

    const response = await POST(
      new Request("https://flashcards.example/auth/recover", {
        method: "POST",
      }),
    );

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(cookieStore.delete).toHaveBeenCalledWith("sb-project-auth-token");
    expect(cookieStore.delete).not.toHaveBeenCalledWith("theme");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://flashcards.example/login",
    );
  });

  it("clears local auth cookies when Supabase Auth is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    createClientMock.mockRejectedValue(new Error("Auth unavailable"));
    const cookieStore = mockCookieStore();

    const response = await POST(
      new Request("https://flashcards.example/auth/recover", {
        method: "POST",
      }),
    );

    expect(cookieStore.delete).toHaveBeenCalledWith("sb-project-auth-token");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://flashcards.example/login",
    );
  });
});
