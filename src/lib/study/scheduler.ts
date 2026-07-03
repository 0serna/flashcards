import { cardReviewRating } from "@/lib/db/enums";

export type ReviewRating = (typeof cardReviewRating)[number];

export const FIRST_REMEMBERED_INTERVAL_MINUTES = 3 * 24 * 60;
export const PARTIAL_INTERVAL_MINUTES = 24 * 60;
export const FORGOTTEN_INTERVAL_MINUTES = 10;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.0;
export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_INTERVAL_MINUTES = 1;

const FLOATING_POINT_TOLERANCE = 1e-9;

const RATING_TO_QUALITY: Record<ReviewRating, number> = {
  forgotten: 0,
  partial: 3,
  remembered: 5,
};

export type ScheduleInput = {
  rating: ReviewRating;
  previousDueAt: Date;
  previousEaseFactor: number;
  previousReviewCount: number;
  previousIntervalMinutes: number;
  reviewedAt: Date;
};

export type ScheduleOutput = {
  rating: ReviewRating;
  reviewedAt: Date;
  previousDueAt: Date;
  nextDueAt: Date;
  scheduledMinutes: number;
  previousEaseFactor: number;
  nextEaseFactor: number;
  nextReviewCount: number;
  nextIntervalMinutes: number;
};

function clampEaseFactor(ease: number) {
  if (ease < MIN_EASE_FACTOR) return MIN_EASE_FACTOR;
  if (ease > MAX_EASE_FACTOR) return MAX_EASE_FACTOR;
  return ease;
}

function calculateNextEaseFactor(previousEase: number, quality: number) {
  const next =
    previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return clampEaseFactor(next);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function calculateRememberedIntervalMinutes(
  previousIntervalMinutes: number,
  easeFactor: number,
) {
  if (previousIntervalMinutes <= 0) {
    return FIRST_REMEMBERED_INTERVAL_MINUTES;
  }
  return Math.ceil(
    previousIntervalMinutes * easeFactor - FLOATING_POINT_TOLERANCE,
  );
}

export function scheduleReview(input: ScheduleInput): ScheduleOutput {
  const quality = RATING_TO_QUALITY[input.rating];
  const nextEase = calculateNextEaseFactor(input.previousEaseFactor, quality);

  let nextIntervalMinutes: number;
  let nextReviewCount: number;

  if (input.rating === "forgotten") {
    nextIntervalMinutes = FORGOTTEN_INTERVAL_MINUTES;
    nextReviewCount = 0;
  } else if (input.rating === "partial") {
    nextIntervalMinutes = PARTIAL_INTERVAL_MINUTES;
    nextReviewCount = input.previousReviewCount;
  } else {
    nextIntervalMinutes = calculateRememberedIntervalMinutes(
      input.previousIntervalMinutes,
      nextEase,
    );
    nextReviewCount = input.previousReviewCount + 1;
  }

  if (nextIntervalMinutes < MIN_INTERVAL_MINUTES) {
    nextIntervalMinutes = MIN_INTERVAL_MINUTES;
  }

  const nextDueAt = addMinutes(input.reviewedAt, nextIntervalMinutes);

  return {
    rating: input.rating,
    reviewedAt: input.reviewedAt,
    previousDueAt: input.previousDueAt,
    nextDueAt,
    scheduledMinutes: nextIntervalMinutes,
    previousEaseFactor: input.previousEaseFactor,
    nextEaseFactor: nextEase,
    nextReviewCount,
    nextIntervalMinutes,
  };
}

export function isStudyRating(value: string): value is ReviewRating {
  return (cardReviewRating as readonly string[]).includes(value);
}
