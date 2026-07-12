import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorRecovery } from "./error-recovery";

describe("ErrorRecovery", () => {
  it("retries the failed screen and provides a document-level sign-out escape", () => {
    const unstableRetry = vi.fn();

    render(
      <ErrorRecovery
        error={Object.assign(new Error("failed"), { digest: "179862997" })}
        unstable_retry={unstableRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(unstableRetry).toHaveBeenCalledOnce();
    expect(screen.getByText("179862997")).toHaveClass("select-all");
    expect(
      screen.getByRole("button", { name: "Sign out and return to login" }),
    ).toHaveAttribute("type", "submit");
    expect(
      screen
        .getByRole("button", { name: "Sign out and return to login" })
        .closest("form"),
    ).toHaveAttribute("action", "/auth/recover");
    expect(
      screen
        .getByRole("button", { name: "Sign out and return to login" })
        .closest("form"),
    ).toHaveAttribute("method", "post");
    expect(screen.queryByRole("link", { name: "Go home" })).toBeNull();
  });
});
