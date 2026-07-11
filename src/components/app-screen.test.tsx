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
});
