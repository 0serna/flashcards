import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  preloadUpcomingImages,
  type PreloadSource,
} from "./preload-study-images";

const originalNavigator = globalThis.navigator;
const originalImage = globalThis.Image;

function fakeCards(): PreloadSource[] {
  return [
    {
      front: { imageUrl: null },
      back: { imageUrl: null },
    },
    {
      front: { imageUrl: "/img/c1-front.webp" },
      back: { imageUrl: "/img/c1-back.webp" },
    },
    {
      front: { imageUrl: "/img/c2-front.webp" },
      back: { imageUrl: null },
    },
    {
      front: { imageUrl: null },
      back: { imageUrl: "/img/c3-back.webp" },
    },
    ...Array.from({ length: 12 }, (_, i) => ({
      front: { imageUrl: `/img/c${i + 4}-front.webp` },
      back: { imageUrl: `/img/c${i + 4}-back.webp` },
    })),
  ];
}

function trackLoadedImages() {
  const loaded: string[] = [];
  class TrackingImage {
    constructor() {
      void this;
    }
    set src(value: string) {
      if (value) loaded.push(value);
    }
  }
  globalThis.Image = TrackingImage as never;
  return loaded;
}

beforeEach(() => {
  class FakeImage {
    public src = "";
    constructor() {
      void this;
    }
  }
  globalThis.Image = FakeImage as never;
  const navigatorMock: { connection?: Record<string, unknown> } = {};
  Object.defineProperty(globalThis, "navigator", {
    value: navigatorMock,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  globalThis.Image = originalImage;
  Object.defineProperty(globalThis, "navigator", {
    value: originalNavigator,
    configurable: true,
    writable: true,
  });
  vi.restoreAllMocks();
});

function setConnection(value: Record<string, unknown> | undefined) {
  Object.defineProperty(globalThis.navigator, "connection", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("preloadUpcomingImages", () => {
  it("preloads the front and back images of the next ten cards", () => {
    const loaded = trackLoadedImages();
    setConnection(undefined);

    const cards = fakeCards();
    preloadUpcomingImages(cards, 0);

    // Cards 1..10: skip cards with null image URLs but include the
    // remaining sides, and stop after the tenth card.
    expect(loaded).toEqual([
      "/img/c1-front.webp",
      "/img/c1-back.webp",
      "/img/c2-front.webp",
      "/img/c3-back.webp",
      "/img/c4-front.webp",
      "/img/c4-back.webp",
      "/img/c5-front.webp",
      "/img/c5-back.webp",
      "/img/c6-front.webp",
      "/img/c6-back.webp",
      "/img/c7-front.webp",
      "/img/c7-back.webp",
      "/img/c8-front.webp",
      "/img/c8-back.webp",
      "/img/c9-front.webp",
      "/img/c9-back.webp",
      "/img/c10-front.webp",
      "/img/c10-back.webp",
    ]);
  });

  it("skips cards without an image on either side", () => {
    const loaded = trackLoadedImages();
    setConnection(undefined);

    const cards: PreloadSource[] = [
      { front: { imageUrl: null }, back: { imageUrl: null } },
      { front: { imageUrl: null }, back: { imageUrl: null } },
      { front: { imageUrl: null }, back: { imageUrl: null } },
      { front: { imageUrl: "/img/only.webp" }, back: { imageUrl: null } },
      { front: { imageUrl: null }, back: { imageUrl: "/img/only-back.webp" } },
    ];
    preloadUpcomingImages(cards, 0);

    expect(loaded).toEqual(["/img/only.webp", "/img/only-back.webp"]);
  });

  it("never preloads more than twenty images even when more cards are available", () => {
    const loaded = trackLoadedImages();
    setConnection(undefined);

    const cards = fakeCards();
    preloadUpcomingImages(cards, 0);

    expect(loaded.length).toBeLessThanOrEqual(20);
  });

  it("does not preload anything when the browser reports data saving", () => {
    const loaded = trackLoadedImages();
    setConnection({ saveData: true });

    const cards = fakeCards();
    preloadUpcomingImages(cards, 0);

    expect(loaded).toEqual([]);
  });

  it("does not preload anything when the browser reports a slow connection", () => {
    const loaded = trackLoadedImages();
    setConnection({ effectiveType: "2g" });

    const cards = fakeCards();
    preloadUpcomingImages(cards, 0);

    expect(loaded).toEqual([]);
  });

  it("falls back to the bounded behavior when connection information is missing", () => {
    const loaded = trackLoadedImages();
    setConnection({});

    const cards = fakeCards();
    preloadUpcomingImages(cards, 0);

    expect(loaded.length).toBeGreaterThan(0);
  });

  it("ignores cards before the current index", () => {
    const loaded = trackLoadedImages();
    setConnection(undefined);

    const cards = fakeCards();
    preloadUpcomingImages(cards, 5);

    // Cards 6..15 are in the next ten, so card 0 must not be preloaded.
    expect(loaded).not.toContain("/img/c1-front.webp");
    expect(loaded).toContain("/img/c6-front.webp");
  });
});
