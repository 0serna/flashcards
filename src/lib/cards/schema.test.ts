import { describe, expect, it } from "vitest";

import {
  cardCreateSchema,
  cardIdSchema,
  cardImageMetadataSchema,
  cardImagePathSchema,
  cardTextSchema,
  cardUpdateSchema,
} from "./schema";

describe("cardIdSchema", () => {
  it("accepts a uuid", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(cardIdSchema.parse(id)).toBe(id);
  });

  it("rejects a non-uuid", () => {
    expect(() => cardIdSchema.parse("not-a-uuid")).toThrow();
  });
});

describe("cardTextSchema", () => {
  it("trims text", () => {
    expect(cardTextSchema.parse("  hello  ")).toBe("hello");
  });

  it("rejects text longer than 2000 characters", () => {
    expect(() => cardTextSchema.parse("a".repeat(2001))).toThrow();
  });
});

describe("cardImagePathSchema", () => {
  it("accepts a relative path", () => {
    expect(cardImagePathSchema.parse("deck/card/front/x.jpg")).toBe(
      "deck/card/front/x.jpg",
    );
  });

  it("rejects paths with spaces or control characters", () => {
    expect(() => cardImagePathSchema.parse("with space.jpg")).toThrow();
  });
});

describe("cardImageMetadataSchema", () => {
  it("accepts a 5 MB JPEG", () => {
    const parsed = cardImageMetadataSchema.parse({
      size: 5 * 1024 * 1024,
      type: "image/jpeg",
      name: "front.jpg",
    });
    expect(parsed.type).toBe("image/jpeg");
  });

  it("rejects an oversized image", () => {
    expect(() =>
      cardImageMetadataSchema.parse({
        size: 5 * 1024 * 1024 + 1,
        type: "image/png",
        name: "front.png",
      }),
    ).toThrow(/5 MB/);
  });

  it("rejects a disallowed mime type", () => {
    expect(() =>
      cardImageMetadataSchema.parse({
        size: 1024,
        type: "image/gif",
        name: "front.gif",
      }),
    ).toThrow(/JPEG, PNG, or WebP/);
  });
});

describe("cardCreateSchema", () => {
  it("accepts a valid text-only pair", () => {
    const parsed = cardCreateSchema.parse({
      front: { text: "Front" },
      back: { text: "Back" },
    });
    expect(parsed.front.text).toBe("Front");
  });

  it("accepts a text-plus-image pair", () => {
    const parsed = cardCreateSchema.parse({
      front: { text: "Front", imagePath: "deck/card/front/x.jpg" },
      back: { text: "Back" },
    });
    expect(parsed.front.imagePath).toBe("deck/card/front/x.jpg");
  });

  it("rejects a side without text and image", () => {
    expect(() =>
      cardCreateSchema.parse({
        front: {},
        back: { text: "Back" },
      }),
    ).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() =>
      cardCreateSchema.parse({
        front: { text: "Front" },
        back: { text: "Back" },
        extra: "no",
      }),
    ).toThrow();
  });
});

describe("cardUpdateSchema", () => {
  it("accepts a front-only update", () => {
    const parsed = cardUpdateSchema.parse({
      front: { text: "Updated" },
    });
    expect(parsed.front?.text).toBe("Updated");
  });

  it("accepts clearing an image while keeping text", () => {
    const parsed = cardUpdateSchema.parse({
      front: { text: "Front", imagePath: null },
    });
    expect(parsed.front?.imagePath).toBeNull();
  });

  it("rejects clearing image and text together", () => {
    expect(() =>
      cardUpdateSchema.parse({
        front: { text: "", imagePath: null },
      }),
    ).toThrow();
  });

  it("rejects an empty update", () => {
    expect(() => cardUpdateSchema.parse({})).toThrow();
  });
});
