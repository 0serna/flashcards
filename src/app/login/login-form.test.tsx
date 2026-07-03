import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithGoogleMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/login/actions", () => ({
  signInWithGoogle: signInWithGoogleMock,
}));

import { LoginForm } from "@/app/login/login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithGoogleMock.mockResolvedValue({ status: "idle" });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the Google sign-in control with the expected form contract", () => {
    render(<LoginForm />);

    const logo = screen.getByRole("link", { name: "Flashcards" });
    expect(logo).toHaveClass("text-xl");

    const heading = screen.getByRole("heading", { name: /sign in/i });
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText(/continue with your google account/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/calm way back/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();

    const submitButton = screen.getByRole("button", {
      name: /continue with google/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toHaveClass("min-h-11");
  });

  it("shows a Google sign-in error returned by the action", async () => {
    signInWithGoogleMock.mockResolvedValue({
      status: "error",
      message: "We could not start Google sign-in right now. Please try again.",
    });

    render(<LoginForm />);

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/we could not start google sign-in right now/i),
      ).toBeInTheDocument();
    });
  });

  it("shows the auth error message passed from the login page", () => {
    render(
      <LoginForm authErrorMessage="Google sign-in could not be completed. Please try again." />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /google sign-in could not be completed/i,
    );
  });
});
