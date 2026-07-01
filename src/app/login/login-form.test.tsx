import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestMagicLinkMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/login/actions", () => ({
  requestMagicLink: requestMagicLinkMock,
}));

import { LoginForm } from "@/app/login/login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMagicLinkMock.mockResolvedValue({ status: "idle" });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the email field, label, and submit button with the expected form contract", () => {
    render(<LoginForm />);

    const heading = screen.getByRole("heading", { name: /sign in/i });
    expect(heading).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("name", "email");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveClass("min-h-11");

    const submitButton = screen.getByRole("button", {
      name: /send magic link/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toHaveClass("min-h-11");
  });

  it("submits the email value to the server action and shows the success message", async () => {
    requestMagicLinkMock.mockResolvedValue({ status: "success" });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send magic link/i }));

    expect(requestMagicLinkMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /check your email/i }),
      ).toBeInTheDocument();
    });
  });

  it("associates the email field error with the input", async () => {
    requestMagicLinkMock.mockResolvedValue({
      status: "error",
      message: "We could not send the Magic Link right now. Please try again.",
      fieldErrors: { email: ["Please enter a valid email address."] },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send magic link/i }));

    const emailInput = screen.getByLabelText(/email/i);
    const emailError = await screen.findByRole("alert");

    expect(emailError).toHaveTextContent(/please enter a valid email address/i);
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(emailInput).toHaveAccessibleDescription(
      "Please enter a valid email address.",
    );
  });

  it("shows the fallback error message when the action returns a general error", async () => {
    requestMagicLinkMock.mockResolvedValue({
      status: "error",
      message: "We could not send the Magic Link right now. Please try again.",
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send magic link/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/we could not send the magic link right now/i),
      ).toBeInTheDocument();
    });
  });
});
