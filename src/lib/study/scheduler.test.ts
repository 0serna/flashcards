import { describe, expect, it } from "vitest";

import {
  DEFAULT_EASE_FACTOR,
  FIRST_REMEMBERED_INTERVAL_MINUTES,
  FORGOTTEN_INTERVAL_MINUTES,
  MAX_EASE_FACTOR,
  MIN_EASE_FACTOR,
  PARTIAL_INTERVAL_MINUTES,
  scheduleReview,
  isStudyRating,
} from "./scheduler";

const baseInput = {
  previousDueAt: new Date("2024-01-01T00:00:00.000Z"),
  previousEaseFactor: DEFAULT_EASE_FACTOR,
  previousReviewCount: 4,
  previousIntervalMinutes: 7 * 24 * 60,
  reviewedAt: new Date("2024-01-08T00:00:00.000Z"),
};

describe("scheduleReview", () => {
  it("schedules a forgotten rating 10 minutes ahead, resets review count, and applies SM-2 quality 0", () => {
    const result = scheduleReview({ ...baseInput, rating: "forgotten" });

    expect(result.nextIntervalMinutes).toBe(FORGOTTEN_INTERVAL_MINUTES);
    expect(result.scheduledMinutes).toBe(FORGOTTEN_INTERVAL_MINUTES);
    expect(result.nextReviewCount).toBe(0);
    expect(result.nextDueAt.getTime()).toBe(
      baseInput.reviewedAt.getTime() + FORGOTTEN_INTERVAL_MINUTES * 60_000,
    );
    expect(result.nextEaseFactor).toBeCloseTo(1.7);
  });

  it("schedules a partial rating 1 day ahead, keeps review count, and applies SM-2 quality 3", () => {
    const result = scheduleReview({ ...baseInput, rating: "partial" });

    expect(result.nextIntervalMinutes).toBe(PARTIAL_INTERVAL_MINUTES);
    expect(result.scheduledMinutes).toBe(PARTIAL_INTERVAL_MINUTES);
    expect(result.nextReviewCount).toBe(baseInput.previousReviewCount);
    expect(result.nextDueAt.getTime()).toBe(
      baseInput.reviewedAt.getTime() + PARTIAL_INTERVAL_MINUTES * 60_000,
    );
    expect(result.nextEaseFactor).toBeCloseTo(2.36);
  });

  it("schedules the first remembered rating 3 days ahead, increments count, and applies SM-2 quality 5", () => {
    const result = scheduleReview({
      ...baseInput,
      rating: "remembered",
      previousReviewCount: 0,
      previousIntervalMinutes: 0,
    });

    expect(result.nextIntervalMinutes).toBe(FIRST_REMEMBERED_INTERVAL_MINUTES);
    expect(result.scheduledMinutes).toBe(FIRST_REMEMBERED_INTERVAL_MINUTES);
    expect(result.nextReviewCount).toBe(1);
    expect(result.nextDueAt.getTime()).toBe(
      baseInput.reviewedAt.getTime() +
        FIRST_REMEMBERED_INTERVAL_MINUTES * 60_000,
    );
    expect(result.nextEaseFactor).toBeCloseTo(2.6);
  });

  it("scales later remembered intervals using the new ease factor with a 1.3 floor", () => {
    const result = scheduleReview({
      ...baseInput,
      rating: "remembered",
      previousIntervalMinutes: 1000,
      previousEaseFactor: MIN_EASE_FACTOR,
    });

    expect(result.nextEaseFactor).toBeCloseTo(1.4);
    expect(result.nextIntervalMinutes).toBe(1400);
    expect(result.nextReviewCount).toBe(baseInput.previousReviewCount + 1);
  });

  it("scales later remembered intervals using the normal learned ease factor", () => {
    const result = scheduleReview({
      ...baseInput,
      rating: "remembered",
      previousIntervalMinutes: 1000,
      previousEaseFactor: DEFAULT_EASE_FACTOR,
    });

    expect(result.nextEaseFactor).toBeCloseTo(2.6);
    expect(result.nextIntervalMinutes).toBe(2600);
    expect(result.nextReviewCount).toBe(baseInput.previousReviewCount + 1);
  });

  it("clamps the ease factor to the configured minimum and maximum", () => {
    const lowResult = scheduleReview({
      ...baseInput,
      rating: "forgotten",
      previousEaseFactor: MIN_EASE_FACTOR,
    });
    expect(lowResult.nextEaseFactor).toBe(MIN_EASE_FACTOR);

    const highResult = scheduleReview({
      ...baseInput,
      rating: "remembered",
      previousEaseFactor: MAX_EASE_FACTOR,
    });
    expect(highResult.nextEaseFactor).toBeLessThanOrEqual(MAX_EASE_FACTOR);
  });

  it("preserves the previous due timestamp for review snapshots", () => {
    const result = scheduleReview({ ...baseInput, rating: "remembered" });
    expect(result.previousDueAt).toEqual(baseInput.previousDueAt);
    expect(result.previousEaseFactor).toBe(baseInput.previousEaseFactor);
  });
});

describe("isStudyRating", () => {
  it("accepts the three product ratings", () => {
    expect(isStudyRating("remembered")).toBe(true);
    expect(isStudyRating("partial")).toBe(true);
    expect(isStudyRating("forgotten")).toBe(true);
  });

  it("rejects unknown ratings", () => {
    expect(isStudyRating("easy")).toBe(false);
    expect(isStudyRating("")).toBe(false);
  });
});
