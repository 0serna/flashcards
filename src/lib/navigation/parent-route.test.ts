import { describe, expect, it } from "vitest";

import { resolveParentPath } from "./parent-route";

describe("resolveParentPath", () => {
  describe("Home terminal", () => {
    it("returns Home when called with the Home path", () => {
      expect(resolveParentPath("/")).toBe("/");
    });

    it("returns Home for an external-style root with trailing slash", () => {
      // Defensive: callers may hand us a normalized trailing-slash URL.
      expect(resolveParentPath("/?ref=foo")).toBe("/");
    });
  });

  describe("deck-level screens", () => {
    it("returns Home for the archived-decks list", () => {
      expect(resolveParentPath("/decks/archived")).toBe("/");
    });

    it("returns Home for the new-deck form", () => {
      expect(resolveParentPath("/decks/new")).toBe("/");
    });

    it("returns Home for a deck detail page", () => {
      expect(resolveParentPath("/decks/abc123")).toBe("/");
    });

    it("returns Home for a deck detail page with query string", () => {
      expect(resolveParentPath("/decks/abc123?focus=foo")).toBe("/");
    });
  });

  describe("deck-scoped screens", () => {
    it("returns the deck detail for the edit-deck form", () => {
      expect(resolveParentPath("/decks/abc123/edit")).toBe("/decks/abc123");
    });

    it("returns the deck detail for the new-card form", () => {
      expect(resolveParentPath("/decks/abc123/cards/new")).toBe(
        "/decks/abc123",
      );
    });

    it("returns the deck detail for the archived-cards list", () => {
      expect(resolveParentPath("/decks/abc123/cards/archived")).toBe(
        "/decks/abc123",
      );
    });

    it("returns the deck detail for the study screen in review mode", () => {
      expect(resolveParentPath("/decks/abc123/study?mode=review")).toBe(
        "/decks/abc123",
      );
    });

    it("returns the deck detail for the study screen in practice mode", () => {
      expect(resolveParentPath("/decks/abc123/study?mode=practice")).toBe(
        "/decks/abc123",
      );
    });

    it("returns the deck detail for the study screen with no mode query", () => {
      // The page defaults to review; the resolver must agree.
      expect(resolveParentPath("/decks/abc123/study")).toBe("/decks/abc123");
    });

    it("returns the deck detail for an edit-card form", () => {
      expect(resolveParentPath("/decks/abc123/cards/card-9/edit")).toBe(
        "/decks/abc123",
      );
    });

    it("returns the deck detail for an edit-card form with query string", () => {
      expect(
        resolveParentPath("/decks/abc123/cards/card-9/edit?focus=front"),
      ).toBe("/decks/abc123");
    });
  });

  describe("safe fallback for unrecognized authenticated routes", () => {
    it("returns Home for an unknown nested route", () => {
      expect(resolveParentPath("/something/else")).toBe("/");
    });

    it("returns Home for an empty path", () => {
      expect(resolveParentPath("")).toBe("/");
    });
  });
});
