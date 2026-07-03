import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { signOutAction } from "./actions";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("signOutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("signs out the current session and redirects to login", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { signOut },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(signOut).toHaveBeenCalledWith();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
