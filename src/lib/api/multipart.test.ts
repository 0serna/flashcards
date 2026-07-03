import { describe, expect, it } from "vitest";

import { parseCreateImage, parseText, parseUpdateImage } from "./multipart";

describe("multipart parsers", () => {
  it("treats blank text as missing content after trimming", async () => {
    const formData = new FormData();
    formData.append("backText", "   ");

    await expect(parseText(formData, "backText")).resolves.toBeNull();
  });

  it("ignores empty file inputs on create", async () => {
    const formData = new FormData();
    formData.append(
      "frontImage",
      new File([], "", { type: "application/octet-stream" }),
    );

    await expect(parseCreateImage(formData, "frontImage")).resolves.toBeNull();
  });

  it("honors image clear when an empty file input shares the field name", async () => {
    const formData = new FormData();
    formData.append(
      "frontImage",
      new File([], "", { type: "application/octet-stream" }),
    );
    formData.append("frontImage", "clear");

    await expect(parseUpdateImage(formData, "frontImage")).resolves.toBe(
      "clear",
    );
  });
});
