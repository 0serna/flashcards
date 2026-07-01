import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("returns installability metadata for Flashcards", () => {
    const result = manifest();

    expect(result).toMatchObject({
      name: "Flashcards",
      short_name: "Flashcards",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0a0a0a",
    });
  });

  it("references available PNG app icons", () => {
    const result = manifest();

    expect(result.icons).toEqual([
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ]);
    for (const icon of result.icons ?? []) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
