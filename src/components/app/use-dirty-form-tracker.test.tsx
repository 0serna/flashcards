import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { __resetDirtyFormStoreForTests, isFormDirty } from "./dirty-form-store";
import { useDirtyFormTracker } from "./use-dirty-form-tracker";

afterEach(() => {
  cleanup();
  __resetDirtyFormStoreForTests();
});

beforeEach(() => {
  __resetDirtyFormStoreForTests();
});

function TrackedForm() {
  const formRef = useDirtyFormTracker();

  return (
    <form ref={formRef}>
      <label>
        Name
        <input aria-label="Name" />
      </label>
    </form>
  );
}

describe("useDirtyFormTracker", () => {
  it("clears the dirty state when the form leaves the screen", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TrackedForm />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Updated");
    expect(isFormDirty()).toBe(true);

    unmount();

    await waitFor(() => expect(isFormDirty()).toBe(false));
  });
});
