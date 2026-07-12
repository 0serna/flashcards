import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import Link from "next/link";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetDirtyFormStoreForTests,
  markFormDirty,
} from "./dirty-form-store";
import { GuardedLink } from "./guarded-link";
import { NavigationLoading } from "./navigation-loading";

const route = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  route.pathname = "/";
  route.search = "";
  __resetDirtyFormStoreForTests();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe("NavigationLoading", () => {
  it("replaces the current authenticated screen only after a 150 ms navigation delay", () => {
    const { rerender } = render(
      <>
        <NavigationLoading />
        <Link href="/decks" onClick={(event) => event.preventDefault()}>
          Open decks
        </Link>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Open decks" }), {
      button: 0,
    });

    act(() => vi.advanceTimersByTime(149));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(
      screen.getByRole("status", { name: "Loading your next screen" }),
    ).toBeInTheDocument();

    route.pathname = "/decks";
    rerender(
      <>
        <NavigationLoading />
        <Link href="/decks" onClick={(event) => event.preventDefault()}>
          Open decks
        </Link>
      </>,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the current screen visible when a guarded navigation is cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    markFormDirty();

    render(
      <>
        <NavigationLoading />
        <GuardedLink href="/decks">Open decks</GuardedLink>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Open decks" }), {
      button: 0,
    });
    act(() => vi.advanceTimersByTime(150));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
