import { afterEach, describe, expect, it } from "vitest";

import {
  __resetNavigationHistoryForTests,
  getPreviousAppPath,
  recordAppPath,
} from "./navigation-history-store";

afterEach(() => {
  __resetNavigationHistoryForTests();
});

describe("navigation history store", () => {
  it("returns the previous app path after a route change", () => {
    recordAppPath("/decks/deck-1");
    recordAppPath("/decks/deck-1/edit");

    expect(getPreviousAppPath()).toBe("/decks/deck-1");
  });

  it("ignores repeated renders of the same route", () => {
    recordAppPath("/decks/deck-1");
    recordAppPath("/decks/deck-1");
    recordAppPath("/decks/deck-1/edit");

    expect(getPreviousAppPath()).toBe("/decks/deck-1");
  });
});
