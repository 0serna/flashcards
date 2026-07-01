import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("returns the app metadata", () => {
    const result = manifest();
    expect(result.name).toBe("Flashcards");
    expect(result.start_url).toBe("/");
    expect(result.icons).toHaveLength(2);
  });
});
