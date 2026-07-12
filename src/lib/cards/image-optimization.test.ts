import { afterEach, describe, expect, it, vi } from "vitest";

import { CARD_IMAGE_MAX_BYTES } from "./storage";
import {
  CARD_IMAGE_MAX_EDGE_PIXELS,
  CARD_IMAGE_OPTIMIZED_MIME_TYPE,
  optimizeCardImageFile,
} from "./image-optimization";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("optimizeCardImageFile", () => {
  it("returns a smaller WebP resized to the maximum edge", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 2400, height: 1200, close: vi.fn() })),
    );
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn((callback, type) => {
        callback(new Blob([new Uint8Array(100)], { type }));
      }),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      canvas as unknown as HTMLElement,
    );

    const original = new File([new Uint8Array(1000)], "front.png", {
      type: "image/png",
      lastModified: 123,
    });

    const optimized = await optimizeCardImageFile(original);

    expect(optimized).not.toBe(original);
    expect(optimized.name).toBe("front.webp");
    expect(optimized.type).toBe(CARD_IMAGE_OPTIMIZED_MIME_TYPE);
    expect(optimized.size).toBe(100);
    expect(optimized.lastModified).toBe(123);
    expect(canvas.width).toBe(CARD_IMAGE_MAX_EDGE_PIXELS);
    expect(canvas.height).toBe(600);
  });

  it("keeps the original when browser optimization is unavailable", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const original = new File([new Uint8Array(1000)], "front.png", {
      type: "image/png",
    });

    await expect(optimizeCardImageFile(original)).resolves.toBe(original);
  });

  it("rejects originals larger than 5 MB", async () => {
    const original = new File(
      [new Uint8Array(CARD_IMAGE_MAX_BYTES + 1)],
      "front.png",
      { type: "image/png" },
    );

    await expect(optimizeCardImageFile(original)).rejects.toThrow(
      "Image must be 5 MB or smaller",
    );
  });
});
