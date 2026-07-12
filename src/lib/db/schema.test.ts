import { describe, expect, it } from "vitest";

import migration from "../../../drizzle/0000_init.sql?raw";
import migration0001 from "../../../drizzle/0001_card_scheduling_state.sql?raw";
import { cardReviews, cards, decks } from "./schema";
import { cardReviewRating } from "./enums";

describe("card database schema", () => {
  it("declares the card_review_rating enum values", () => {
    expect([...cardReviewRating]).toEqual([
      "remembered",
      "partial",
      "forgotten",
    ]);
    expect(migration).toContain(
      "CREATE TYPE \"card_review_rating\" AS ENUM ('remembered', 'partial', 'forgotten')",
    );
    expect(migration).toMatch(/"rating" "card_review_rating" NOT NULL/);
  });

  it("defines the expected user-owned tables", () => {
    expect(decks).toBeDefined();
    expect(cards).toBeDefined();
    expect(cardReviews).toBeDefined();
  });

  it("uses auth.users as the ownership boundary", () => {
    expect(migration).toMatch(/REFERENCES "auth"\."users"\("id"\)/);
  });

  it("requires both card sides to have text or an image", () => {
    expect(migration).toContain("cards_front_has_content");
    expect(migration).toContain("cards_back_has_content");
  });

  it("adds explicit spaced-repetition state to cards", () => {
    const migration = migration0001;
    expect(migration).toMatch(
      /ALTER TABLE "cards" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL/,
    );
    expect(migration).toMatch(
      /ALTER TABLE "cards" ADD COLUMN "interval_minutes" integer DEFAULT 0 NOT NULL/,
    );
  });

  it("enables row-level security on all application tables", () => {
    expect(migration).toMatch(
      /ALTER TABLE "card_reviews" ENABLE ROW LEVEL SECURITY/,
    );
    expect(migration).toMatch(/ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY/);
    expect(migration).toMatch(/ALTER TABLE "decks" ENABLE ROW LEVEL SECURITY/);
  });

  it("restricts deck access to the owning user", () => {
    expect(migration).toMatch(
      /CREATE POLICY "decks_owner_all" ON "decks".*user_id = auth\.uid\(\)/s,
    );
  });

  it("restricts card access through the parent deck", () => {
    expect(migration).toMatch(/CREATE POLICY "cards_owner_all" ON "cards"/);
    expect(migration).toMatch(/decks\.id = cards\.deck_id/);
  });

  it("restricts card_reviews access to the reviewing user", () => {
    expect(migration).toMatch(
      /CREATE POLICY "card_reviews_owner_all" ON "card_reviews".*user_id = auth\.uid\(\)/s,
    );
  });
});
