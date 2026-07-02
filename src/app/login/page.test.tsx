import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "./page";

describe("LoginPage", () => {
  it("shows one shared login surface without desktop-only marketing copy", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/built for short study sessions/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/quiet way back/i)).not.toBeInTheDocument();
  });

  it("explains when a magic link could not be confirmed", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ error: "magic_link_failed" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /sign-in link is invalid or expired/i,
    );
  });

  it("uses a stable viewport height without forcing auth overflow", async () => {
    const { container } = render(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("min-h-svh");
    expect(main).not.toHaveClass("min-h-dvh");
  });
});
