import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrivateCardImage } from "./private-card-image";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PrivateCardImage", () => {
  it("renders the image once it has loaded and decoded", async () => {
    const user = userEvent.setup();

    render(
      <PrivateCardImage
        src="https://example.test/card-image"
        alt="Front image"
        width={320}
        height={240}
      />,
    );

    const img = screen.getByRole("img", { name: "Front image" });
    expect(img).toHaveAttribute("src", "https://example.test/card-image");
    expect(screen.getByText(/loading image/i)).toBeInTheDocument();

    // Simulate the browser firing `load` after the bytes are decoded.
    img.dispatchEvent(new Event("load", { bubbles: true }));

    await waitFor(() =>
      expect(screen.queryByText(/loading image/i)).not.toBeInTheDocument(),
    );

    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();
    // The image remains in the document with a stable key.
    expect(screen.getByRole("img", { name: "Front image" })).toBe(img);

    // Ensure a single render cycle is observed by the user event setup.
    await user.tab();
  });

  it("replaces the loading state with an unavailable message when loading fails", async () => {
    render(
      <PrivateCardImage
        src="https://example.test/card-image"
        alt="Back image"
        width={320}
        height={240}
      />,
    );

    const img = screen.getByRole("img", { name: "Back image" });
    img.dispatchEvent(new Event("error", { bubbles: true }));

    await waitFor(() =>
      expect(screen.getByText(/image unavailable/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    // The original image element should be removed once we enter the
    // unavailable state to avoid a broken icon overlay.
    expect(
      screen.queryByRole("img", { name: "Back image" }),
    ).not.toBeInTheDocument();
  });

  it("reloads the image when the user activates retry", async () => {
    const user = userEvent.setup();

    render(
      <PrivateCardImage
        src="https://example.test/card-image?v=1"
        alt="Front image"
        width={320}
        height={240}
      />,
    );

    const firstImg = screen.getByRole("img", { name: "Front image" });
    firstImg.dispatchEvent(new Event("error", { bubbles: true }));

    const retry = await screen.findByRole("button", { name: /retry/i });
    await user.click(retry);

    // The component remounts the image request with a new key while
    // preserving the versioned source.
    const secondImg = screen.getByRole("img", { name: "Front image" });
    expect(secondImg).not.toBe(firstImg);
    expect(secondImg).toHaveAttribute(
      "src",
      "https://example.test/card-image?v=1",
    );
    expect(screen.getByText(/loading image/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();

    // Simulate a successful retry.
    secondImg.dispatchEvent(new Event("load", { bubbles: true }));
    await waitFor(() =>
      expect(screen.queryByText(/loading image/i)).not.toBeInTheDocument(),
    );
  });

  it("does not animate the placeholder when prefers-reduced-motion is set", () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMedia);

    render(
      <PrivateCardImage
        src="https://example.test/card-image"
        alt="Front image"
        width={320}
        height={240}
      />,
    );

    const placeholder = document.querySelector(
      "[data-private-card-image-placeholder]",
    );
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute("data-reduced-motion", "true");
  });
});
