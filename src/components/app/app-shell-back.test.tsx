import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppScreen } from "@/components/app-screen";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

const route = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/app/navigation-loading", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/components/app/navigation-loading")
    >();
  return {
    ...actual,
    announceNavigationStart: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  route.pathname = "/";
  router.replace.mockReset();
  router.back.mockReset();
  router.forward.mockReset();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

beforeEach(() => {
  route.pathname = "/";
  window.history.replaceState(null, "", "/");
});

describe("AppScreen authenticated history integration", () => {
  it("does not install a popstate handler for the centered login surface", () => {
    route.pathname = "/login";
    window.history.pushState(null, "", "/login");

    const addSpy = vi.spyOn(window, "addEventListener");

    render(
      <AppScreen variant="centered">
        <p>Login form</p>
      </AppScreen>,
    );

    // The shell must not register any popstate listener on /login. The
    // browser's default chronological history stays in effect.
    const popstateRegistrations = addSpy.mock.calls.filter(
      ([eventName]) => eventName === "popstate",
    );
    expect(popstateRegistrations).toEqual([]);
  });
});
