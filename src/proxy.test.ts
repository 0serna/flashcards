import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";
import { updateSession } from "@/lib/supabase/proxy";

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: vi.fn(),
}));

const updateSessionMock = vi.mocked(updateSession);

function request(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

function matcherRegex() {
  return new RegExp(`^${config.matcher[0]}$`);
}

describe("proxy", () => {
  it("delegates requests to the Supabase session updater", async () => {
    const response = NextResponse.next();
    const nextRequest = request("/");
    updateSessionMock.mockResolvedValue(response);

    await expect(proxy(nextRequest)).resolves.toBe(response);
    expect(updateSession).toHaveBeenCalledWith(nextRequest);
  });

  it("matches app and auth routes but skips framework and public assets", () => {
    const matcher = matcherRegex();

    expect(matcher.test("/")).toBe(true);
    expect(matcher.test("/login")).toBe(true);
    expect(matcher.test("/auth/callback")).toBe(true);
    expect(matcher.test("/_next/static/chunks/app.js")).toBe(false);
    expect(matcher.test("/_next/image?url=%2Ficon.png&w=128&q=75")).toBe(false);
    expect(matcher.test("/favicon.ico")).toBe(false);
    expect(matcher.test("/manifest.webmanifest")).toBe(false);
    expect(matcher.test("/icon-192.png")).toBe(false);
  });

  it("excludes the public release identity endpoint from session processing", () => {
    // The release endpoint is public, returns no user data, and runs on
    // every foreground check. Excluding it from the proxy keeps the
    // hot path free of session lookups.
    const matcher = matcherRegex();
    expect(matcher.test("/api/release")).toBe(false);
  });
});
