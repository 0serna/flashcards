import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReliableForm } from "./reliable-form";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ReliableForm", () => {
  it("synchronously ignores repeated submissions of the same form", () => {
    const action = vi.fn(() => new Promise<void>(() => undefined));
    render(
      <ReliableForm aria-label="card" action={action}>
        <button type="submit">Save</button>
      </ReliableForm>,
    );

    const form = screen.getByRole("form", { name: "card" });
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(action).toHaveBeenCalledOnce();
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("locks independent forms independently", () => {
    const first = vi.fn(() => new Promise<void>(() => undefined));
    const second = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <ReliableForm aria-label="first" action={first}>
          <button type="submit">Save first</button>
        </ReliableForm>
        <ReliableForm aria-label="second" action={second}>
          <button type="submit">Save second</button>
        </ReliableForm>
      </>,
    );

    fireEvent.submit(screen.getByRole("form", { name: "first" }));
    fireEvent.submit(screen.getByRole("form", { name: "second" }));

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("reports an unconfirmed submission and unlocks after 15 seconds", async () => {
    vi.useFakeTimers();
    const action = vi.fn(() => new Promise<void>(() => undefined));
    const onUnconfirmed = vi.fn();
    render(
      <ReliableForm
        aria-label="card"
        action={action}
        onUnconfirmed={onUnconfirmed}
      >
        <button type="submit">Save</button>
      </ReliableForm>,
    );

    fireEvent.submit(screen.getByRole("form", { name: "card" }));
    await act(() => vi.advanceTimersByTimeAsync(15_000));

    expect(onUnconfirmed).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(screen.getByRole("form", { name: "card" })).not.toHaveAttribute(
      "aria-busy",
    );
  });
});
