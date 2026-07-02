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

    const logo = screen.getByRole("link", { name: "Flashcards" });
    expect(logo).toHaveClass("text-xl");

    const heading = screen.getByRole("heading", { name: /sign in/i });
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText(/we’ll email you a sign-in link/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/calm way back/i)).not.toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("name", "email");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveClass("min-h-11");
    expect(emailInput).toHaveClass("bg-background");
    expect(emailInput.closest(".rounded-xl")).toBeNull();

    const submitButton = screen.getByRole("button", {
      name: /send sign-in link/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toHaveClass("min-h-11");
  });

  it("submits the email value and shows recovery actions after sending", async () => {
    requestMagicLinkMock.mockResolvedValue({
      status: "success",
      email: "user@example.com",
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    expect(requestMagicLinkMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /check your email/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/user@example\.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /resend sign-in link/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /use a different email/i }),
    ).toBeInTheDocument();
  });

  it("lets the user return to the email form after a link is sent", async () => {
    requestMagicLinkMock.mockResolvedValue({
      status: "success",
      email: "user@example.com",
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    await screen.findByRole("heading", { name: /check your email/i });
    fireEvent.click(
      screen.getByRole("button", { name: /use a different email/i }),
    );

    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue("user@example.com");
  });

  it("associates the email field error with the input", async () => {
    requestMagicLinkMock.mockResolvedValue({
      status: "error",
      message:
        "We could not send the sign-in link right now. Please try again.",
      fieldErrors: { email: ["Please enter a valid email address."] },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

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
      message:
        "We could not send the sign-in link right now. Please try again.",
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/we could not send the sign-in link right now/i),
      ).toBeInTheDocument();
    });
  });
});
