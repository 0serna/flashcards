import { afterEach, describe, expect, it } from "vitest";

import {
  __resetDirtyFormStoreForTests,
  isFormDirty,
  markFormClean,
  markFormDirty,
} from "./dirty-form-store";

afterEach(() => {
  __resetDirtyFormStoreForTests();
});

describe("dirty-form store", () => {
  it("starts clean", () => {
    expect(isFormDirty()).toBe(false);
  });

  it("flips to dirty on markFormDirty", () => {
    markFormDirty();
    expect(isFormDirty()).toBe(true);
  });

  it("returns to clean on markFormClean", () => {
    markFormDirty();
    markFormClean();
    expect(isFormDirty()).toBe(false);
  });
});
