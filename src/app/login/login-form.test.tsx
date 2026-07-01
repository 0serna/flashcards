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

    const submitButton = screen.getByRole("button", {
      name: /send magic link/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
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

  it("shows the email field error returned by the action", async () => {
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

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i),
      ).toBeInTheDocument();
    });
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
