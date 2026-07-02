import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function relativeLuminanceFromOklchLightness(lightness: number) {
  const channel =
    lightness <= 0.0031308
      ? 12.92 * lightness
      : 1.055 * lightness ** (1 / 2.4) - 0.055;

  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function contrast(lightnessA: number, lightnessB: number) {
  const a = relativeLuminanceFromOklchLightness(lightnessA);
  const b = relativeLuminanceFromOklchLightness(lightnessB);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("theme tokens", () => {
  it("uses a visible light-theme focus ring", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    const rootBlock = globals.match(/:root \{([\s\S]*?)\n\}/)?.[1];
    const ringLightness = rootBlock?.match(
      /--ring: oklch\(([0-9.]+) 0 0\)/,
    )?.[1];

    expect(ringLightness).toBeDefined();
    expect(contrast(Number(ringLightness), 1)).toBeGreaterThanOrEqual(3);
  });
});
