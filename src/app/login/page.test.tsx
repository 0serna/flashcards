import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "./page";

describe("LoginPage", () => {
  it("shows one shared login surface without desktop-only marketing copy", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/built for short study sessions/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/quiet way back/i)).not.toBeInTheDocument();
  });
});
