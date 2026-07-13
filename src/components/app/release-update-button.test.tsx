import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetPendingMutationsForTests } from "@/lib/navigation/pending-mutations";

import { ReleaseUpdateButton } from "./release-update-button";

const ENV_KEY = "NEXT_PUBLIC_APP_RELEASE_ID";

const fetchMock = vi.fn();
const reloadMock = vi.fn();

function mockFetchResponse(body: unknown, init?: { ok?: boolean }) {
  return new Response(JSON.stringify(body), {
    status: init?.ok === false ? 500 : 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("location", { ...window.location, reload: reloadMock });
  // jsdom does not implement scrollIntoView; the component does not
  // need it but a stray cleanup hook could.
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  __resetPendingMutationsForTests();
  delete process.env[ENV_KEY];
  fetchMock.mockReset();
  reloadMock.mockReset();
  vi.restoreAllMocks();
});

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("ReleaseUpdateButton", () => {
  it("renders nothing when release metadata is missing", async () => {
    delete process.env[ENV_KEY];
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: null }));

    const { container } = render(<ReleaseUpdateButton />);

    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("performs an initial check on mount and renders nothing when the release matches", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "loaded-id" }));

    const { container } = render(<ReleaseUpdateButton />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/release", {
      cache: "no-store",
      credentials: "omit",
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the update action when the loaded release differs from the active release", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    render(<ReleaseUpdateButton />);

    const button = await screen.findByRole("button", { name: /^update$/i });
    expect(button).toBeInTheDocument();
  });

  it("treats a missing active identity as no update", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: null }));

    const { container } = render(<ReleaseUpdateButton />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("re-checks when the document becomes visible and hides the action when the active release returns to the loaded identity", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock
      .mockResolvedValueOnce(mockFetchResponse({ releaseId: "active-id" }))
      .mockResolvedValueOnce(mockFetchResponse({ releaseId: "loaded-id" }));

    render(<ReleaseUpdateButton />);

    await screen.findByRole("button", { name: /^update$/i });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /^update$/i })).toBeNull(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("re-checks when the window regains focus", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock
      .mockResolvedValueOnce(mockFetchResponse({ releaseId: "active-id" }))
      .mockResolvedValueOnce(mockFetchResponse({ releaseId: "loaded-id" }));

    render(<ReleaseUpdateButton />);

    await screen.findByRole("button", { name: /^update$/i });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("keeps the interface unchanged when a check fails", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockRejectedValue(new Error("network down"));

    const { container } = render(<ReleaseUpdateButton />);

    await flushMicrotasks();
    await flushMicrotasks();
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("deduplicates overlapping checks triggered by a visibility + focus burst", async () => {
    process.env[ENV_KEY] = "loaded-id";
    let resolveFetch: ((value: Response) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<ReleaseUpdateButton />);
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch?.(mockFetchResponse({ releaseId: "active-id" }));
    });

    await screen.findByRole("button", { name: /^update$/i });
  });

  it("ignores completions that resolve after the component unmounts", async () => {
    process.env[ENV_KEY] = "loaded-id";
    let resolveFetch: ((value: Response) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { unmount } = render(<ReleaseUpdateButton />);
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      resolveFetch?.(mockFetchResponse({ releaseId: "active-id" }));
    });

    // No state update is required; the test passes as long as the
    // promise resolution does not throw or warn.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not install any periodic polling timers", async () => {
    vi.useFakeTimers();
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "loaded-id" }));

    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    render(<ReleaseUpdateButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });

  it("announces the reloading state through the accessible button label", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    const user = userEvent.setup();
    render(<ReleaseUpdateButton />);
    const button = await screen.findByRole("button", { name: /^update$/i });
    await user.click(button);

    // The button is now disabled and announces the reloading state.
    const reloadButton = await screen.findByRole("button", {
      name: /updating/i,
    });
    expect(reloadButton).toBeDisabled();
    // No release details leak into the visible label.
    expect(reloadButton.textContent ?? "").not.toMatch(/v?\d+\.\d+\.\d+/);
  });
});

describe("ReleaseUpdateButton interaction", () => {
  it("exposes a single accessible persistent action labeled Update", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    const { rerender } = render(<ReleaseUpdateButton />);

    const button = await screen.findByRole("button", { name: /^update$/i });
    expect(button).toBeEnabled();
    expect(button).toHaveAccessibleName(/update/i);

    // Forcing a re-render (e.g. parent re-render) does not unmount or
    // hide the action while the mismatch persists.
    rerender(<ReleaseUpdateButton />);
    expect(
      screen.getByRole("button", { name: /^update$/i }),
    ).toBeInTheDocument();
  });

  it("presents the available update as an informational ghost action", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    render(<ReleaseUpdateButton />);

    const button = await screen.findByRole("button", { name: /^update$/i });
    expect(button).toHaveClass("text-info");
    expect(button).toHaveClass("hover:bg-info-surface");
    expect(button).not.toHaveClass("bg-secondary");
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("announces the available update to assistive tech when it appears", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    const { container } = render(<ReleaseUpdateButton />);

    await screen.findByRole("button", { name: /^update$/i });
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent ?? "").toMatch(/update/i);
  });

  it("reloads the current window after a successful update click", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));
    const user = userEvent.setup();

    render(<ReleaseUpdateButton />);
    const button = await screen.findByRole("button", { name: /^update$/i });
    await user.click(button);

    await waitFor(() => expect(reloadMock).toHaveBeenCalledTimes(1));
  });

  it("waits for a pending mutation to settle before reloading", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    let resolveMutation: (() => void) | null = null;
    const { runWithPendingMutation } =
      await import("@/lib/navigation/pending-mutations");
    const mutation = runWithPendingMutation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    );

    const user = userEvent.setup();
    render(<ReleaseUpdateButton />);
    const button = await screen.findByRole("button", { name: /^update$/i });
    await user.click(button);

    // The reload must not happen before the mutation resolves.
    await flushMicrotasks();
    expect(reloadMock).not.toHaveBeenCalled();

    resolveMutation?.();
    await mutation;
    await flushMicrotasks();

    await waitFor(() => expect(reloadMock).toHaveBeenCalledTimes(1));
  });

  it("ends the update attempt without reloading when the wait times out and keeps the action available", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    const { runWithPendingMutation } =
      await import("@/lib/navigation/pending-mutations");
    // Register a mutation that will never resolve during the test.
    runWithPendingMutation(() => new Promise<void>(() => undefined));

    const user = userEvent.setup();
    render(<ReleaseUpdateButton />);
    const button = await screen.findByRole("button", { name: /^update$/i });

    // The wait is bounded to 15 seconds. Wait for the action to
    // re-arm instead of the reload, which the timeout suppresses.
    await user.click(button);
    // After the timeout, the button becomes enabled again with the
    // `Update` label (not `Updating…`).
    await waitFor(
      () => {
        const reloaded = screen.getByRole("button", { name: /^update$/i });
        expect(reloaded).toBeEnabled();
      },
      { timeout: 16_000, interval: 250 },
    );

    expect(reloadMock).not.toHaveBeenCalled();
    // The action remains visible and re-armed for a second attempt.
    expect(
      screen.getByRole("button", { name: /^update$/i }),
    ).toBeInTheDocument();
  }, 20_000);

  it("does not perform a connectivity preflight before reloading", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));
    // The component must never call navigator.onLine or ping the
    // release endpoint a second time before reloading.
    const user = userEvent.setup();
    const onLineSpy = vi.spyOn(navigator, "onLine", "get");

    render(<ReleaseUpdateButton />);
    const button = await screen.findByRole("button", { name: /^update$/i });
    const callsBefore = fetchMock.mock.calls.length;
    await user.click(button);

    await waitFor(() => expect(reloadMock).toHaveBeenCalled());
    expect(onLineSpy).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });

  it("leaves the current document loaded when the user declines the dirty-form prompt", async () => {
    process.env[ENV_KEY] = "loaded-id";
    fetchMock.mockResolvedValue(mockFetchResponse({ releaseId: "active-id" }));

    // The mocked reload models the browser: dispatch a `beforeunload`
    // event that the existing dirty-form listener can prevent. The
    // tracker counts reloads that actually proceeded past the guard.
    let actualReloadCount = 0;
    reloadMock.mockImplementation(() => {
      // Browsers treat the `beforeunload` event as cancellable; mirror
      // that here so the listener's `preventDefault` actually flips
      // `defaultPrevented`.
      const event = new Event("beforeunload", {
        cancelable: true,
      }) as BeforeUnloadEvent;
      window.dispatchEvent(event);
      if (event.defaultPrevented) return;
      actualReloadCount += 1;
    });

    const { markFormDirty, markFormClean, isFormDirty } =
      await import("./dirty-form-store");
    const { useUnsavedChangesWarning } =
      await import("./use-unsaved-changes-warning");
    markFormDirty();
    expect(isFormDirty()).toBe(true);

    function DirtyProbe() {
      useUnsavedChangesWarning();
      return null;
    }

    const user = userEvent.setup();
    const addSpy = vi.spyOn(window, "addEventListener");
    render(
      <>
        <DirtyProbe />
        <ReleaseUpdateButton />
      </>,
    );
    // The dirty-form listener must be in place before the user activates
    // the update; verify the effect ran.
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function)),
    );

    const button = await screen.findByRole("button", { name: /^update$/i });
    await user.click(button);
    await flushMicrotasks();

    // The existing `useUnsavedChangesWarning` hook prevents the unload,
    // so the reload is suppressed.
    expect(actualReloadCount).toBe(0);
    // The action re-arms once the deferred probe confirms the page is
    // still loaded.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^update$/i }),
      ).toBeInTheDocument(),
    );

    markFormClean();
  });
});
