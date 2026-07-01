import { describe, expect, it } from "vitest";
import { emailSchema } from "./schema";

describe("emailSchema", () => {
  it("accepts a valid email address", () => {
    const result = emailSchema.safeParse({ email: "User@Example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects an empty string", () => {
    const result = emailSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a string without an @ symbol", () => {
    const result = emailSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing email field", () => {
    const result = emailSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("trims surrounding whitespace before validation", () => {
    const result = emailSchema.safeParse({ email: "  user@example.com  " });
    expect(result.success).toBe(true);
  });
});
