import { describe, expect, it } from "vitest";
import {
  deckCreateSchema,
  deckDescriptionSchema,
  deckNameSchema,
  deckUpdateSchema,
} from "./schema";

describe("deckNameSchema", () => {
  it("trims and accepts a non-empty name", () => {
    const result = deckNameSchema.parse("  Spanish basics  ");
    expect(result).toBe("Spanish basics");
  });

  it("rejects an empty name", () => {
    expect(() => deckNameSchema.parse("")).toThrow();
  });

  it("rejects a name longer than 120 characters", () => {
    expect(() => deckNameSchema.parse("a".repeat(121))).toThrow();
  });
});

describe("deckDescriptionSchema", () => {
  it("accepts undefined descriptions", () => {
    expect(deckDescriptionSchema.parse(undefined)).toBeUndefined();
  });

  it("trims long descriptions within limit", () => {
    const trimmed = "a".repeat(2000);
    expect(deckDescriptionSchema.parse(trimmed)).toBe(trimmed);
  });

  it("rejects descriptions over 2000 characters", () => {
    expect(() => deckDescriptionSchema.parse("a".repeat(2001))).toThrow();
  });
});

describe("deckCreateSchema", () => {
  const id = "11111111-1111-4111-8111-111111111111";

  it("accepts a valid payload with description", () => {
    const result = deckCreateSchema.parse({
      id,
      name: "  Spanish basics  ",
      description: "  Common words  ",
    });
    expect(result).toEqual({
      id,
      name: "Spanish basics",
      description: "Common words",
    });
  });

  it("accepts a payload without a description", () => {
    const result = deckCreateSchema.parse({ id, name: "Biology" });
    expect(result.description).toBeUndefined();
  });

  it("rejects payloads without a name", () => {
    expect(() => deckCreateSchema.parse({})).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() =>
      deckCreateSchema.parse({ name: "x", archivedAt: "y" }),
    ).toThrow();
  });
});

describe("deckUpdateSchema", () => {
  const expectedUpdatedAt = "2024-01-01T00:00:00.000Z";

  it("accepts a name-only update", () => {
    expect(
      deckUpdateSchema.parse({ expectedUpdatedAt, name: "Renamed" }),
    ).toEqual({
      expectedUpdatedAt,
      name: "Renamed",
    });
  });

  it("accepts a description-only update", () => {
    expect(
      deckUpdateSchema.parse({ expectedUpdatedAt, description: "Updated" }),
    ).toEqual({ expectedUpdatedAt, description: "Updated" });
  });

  it("rejects an empty update", () => {
    expect(() => deckUpdateSchema.parse({})).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() => deckUpdateSchema.parse({ archivedAt: "x" })).toThrow();
  });
});
