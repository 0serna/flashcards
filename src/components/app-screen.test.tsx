import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppScreen } from "./app-screen";

afterEach(cleanup);

describe("AppScreen", () => {
  it("keeps header placement independent from content spacing", () => {
    render(
      <AppScreen contentClassName="py-4" signOutAction={vi.fn()}>
        <p>Screen content</p>
      </AppScreen>,
    );

    const header = screen.getByRole("banner");
    const shell = header.parentElement;
    const content = screen.getByText("Screen content").parentElement;

    expect(shell).not.toHaveClass("py-4");
    expect(content).toHaveClass("py-4");
  });

  it("constrains the shell to a single global reading width", () => {
    const { container } = render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Screen content</p>
      </AppScreen>,
    );

    // The same max width applies to every screen so all views line up
    // regardless of where they're rendered from.
    const shell = container.querySelector('[data-app-shell="true"]');
    expect(shell).toHaveClass("max-w-md");
    expect(screen.getByRole("main")).toHaveClass("bg-secondary/30");
  });

  it("renders the authenticated header only when signOutAction is provided", () => {
    const { rerender } = render(
      <AppScreen>
        <p>Anonymous content</p>
      </AppScreen>,
    );

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();

    rerender(
      <AppScreen signOutAction={vi.fn()}>
        <p>Authenticated content</p>
      </AppScreen>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("centers content vertically in the centered variant and hides the header", () => {
    const { container } = render(
      <AppScreen variant="centered">
        <p>Login content</p>
      </AppScreen>,
    );

    const shell = container.querySelector('[data-app-shell="true"]');
    expect(shell).toHaveClass("items-center");
    expect(shell).toHaveClass("justify-center");
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("keeps the same width constraint in both variants", () => {
    const fill = render(
      <AppScreen signOutAction={vi.fn()}>
        <p>Fill</p>
      </AppScreen>,
    );
    const centered = render(
      <AppScreen variant="centered">
        <p>Centered</p>
      </AppScreen>,
    );

    const fillShell = fill.container.querySelector('[data-app-shell="true"]');
    const centeredShell = centered.container.querySelector(
      '[data-app-shell="true"]',
    );

    expect(fillShell).toHaveClass("max-w-md");
    expect(centeredShell).toHaveClass("max-w-md");
  });
});
