"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { ViewTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import styles from "./study-session.module.css";

export type StudyCardPayload = {
  id: string;
  deckId: string;
  front: { text: string | null; imageUrl: string | null };
  back: { text: string | null; imageUrl: string | null };
};

export type StudyRating = "remembered" | "partial" | "forgotten";

export type StudySessionProps = {
  mode: "review" | "practice";
  deckId: string;
  deckName: string;
  initialCards: StudyCardPayload[];
  submitRating: (
    cardId: string,
    rating: StudyRating,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const RATING_LABELS: Record<StudyRating, string> = {
  forgotten: "I forgot",
  partial: "Almost",
  remembered: "I knew it",
};

const RATING_ORDER: readonly StudyRating[] = [
  "forgotten",
  "partial",
  "remembered",
];

export function StudySession({
  mode,
  deckId,
  deckName,
  initialCards,
  submitRating,
}: StudySessionProps) {
  const orderedCards = initialCards;

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [studied, setStudied] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<StudyRating, number>>(
    {
      forgotten: 0,
      partial: 0,
      remembered: 0,
    },
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRated, setJustRated] = useState<StudyRating | null>(null);

  if (orderedCards.length === 0) {
    return (
      <ViewTransition name="study-empty" default="none">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {mode === "review"
              ? "No flashcards are due right now."
              : "This deck has no active flashcards."}
          </p>
          {mode === "review" ? (
            <Button asChild variant="secondary" className="w-full">
              <Link
                href={`/decks/${deckId}/study?mode=practice`}
                prefetch={false}
              >
                Practice anyway
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="w-full">
            <Link replace href={`/decks/${deckId}`}>
              Back to {deckName}
            </Link>
          </Button>
        </div>
      </ViewTransition>
    );
  }

  if (index >= orderedCards.length) {
    return (
      <ViewTransition name="study-summary" default="none">
        <div className={cn("space-y-5", styles.summaryBlock)}>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You studied {studied} {studied === 1 ? "card" : "cards"}.
            </p>
            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              {RATING_ORDER.map((rating, summaryIndex) => (
                <div
                  key={rating}
                  className={cn(
                    "rounded-lg border border-border px-2 py-3",
                    styles.summaryCell,
                  )}
                  style={{ ["--summary-i" as string]: summaryIndex }}
                >
                  <dt className="text-xs text-muted-foreground">
                    {RATING_LABELS[rating]}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {ratingCounts[rating]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <Button asChild className="w-full">
            <Link replace href={`/decks/${deckId}`}>
              Back to {deckName}
            </Link>
          </Button>
        </div>
      </ViewTransition>
    );
  }

  const current = orderedCards[index];
  if (!current) {
    return null;
  }

  async function handleRate(rating: StudyRating) {
    if (pending) return;
    setPending(true);
    setError(null);
    setJustRated(rating);
    const result = await submitRating(current.id, rating);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      setJustRated(null);
      return;
    }
    setStudied((value) => value + 1);
    setRatingCounts((counts) => ({
      ...counts,
      [rating]: counts[rating] + 1,
    }));
    setRevealed(false);
    setIndex((value) => value + 1);
    setPending(false);
    setJustRated(null);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setRevealed((value) => !value);
  }

  return (
    <ViewTransition name="study-card" default="none">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {mode === "review" ? "Review" : "Practice"} · {index + 1}/
            {orderedCards.length}
          </p>
          <Link
            href={`/decks/${deckId}`}
            replace
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            End session
          </Link>
        </div>

        <article
          key={current.id}
          className={styles.cardStage}
          aria-label="Study card"
        >
          <div
            className={styles.flashcard}
            role="button"
            tabIndex={0}
            aria-pressed={revealed}
            aria-label={revealed ? "Show question" : "Show answer"}
            onClick={() => setRevealed((value) => !value)}
            onKeyDown={handleCardKeyDown}
          >
            <div
              className={styles.cardInner}
              data-revealed={revealed}
              aria-live="polite"
            >
              <div className={styles.cardFace} aria-hidden={revealed}>
                <CardFace
                  label="Question"
                  text={current.front.text}
                  imageUrl={current.front.imageUrl}
                />
                <span className={styles.flipHint}>
                  <RotateCcw aria-hidden="true" />
                  Tap or click to reveal answer
                </span>
              </div>
              <div
                className={`${styles.cardFace} ${styles.cardBack}`}
                aria-hidden={!revealed}
              >
                <CardFace
                  label="Answer"
                  text={current.back.text}
                  imageUrl={current.back.imageUrl}
                />
                <span className={styles.flipHint}>
                  <RotateCcw aria-hidden="true" />
                  Tap or click to see question
                </span>
              </div>
            </div>
          </div>
        </article>

        {error ? (
          <p
            key={error}
            className={cn("text-sm text-destructive", styles.errorMessage)}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {revealed ? (
          <div className="flex gap-2">
            {RATING_ORDER.map((rating, ratingIndex) => (
              <Button
                key={rating}
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => handleRate(rating)}
                className={cn("min-w-0 flex-1 px-2", styles.ratingButton)}
                data-rating={rating}
                data-just-rated={justRated === rating ? "true" : undefined}
                style={{ ["--rating-i" as string]: ratingIndex }}
              >
                {RATING_LABELS[rating]}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </ViewTransition>
  );
}

function CardFace({
  label,
  text,
  imageUrl,
}: {
  label: string;
  text: string | null;
  imageUrl: string | null;
}) {
  const [imageSize, setImageSize] = useState({ width: 720, height: 480 });

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {text ? (
        <p className="max-w-prose whitespace-pre-wrap break-words text-xl leading-8 text-balance sm:text-2xl">
          {text}
        </p>
      ) : null}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${label} image`}
          width={imageSize.width}
          height={imageSize.height}
          unoptimized
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
              setImageSize({
                width: image.naturalWidth,
                height: image.naturalHeight,
              });
            }
          }}
          className="h-auto max-h-52 w-auto max-w-full rounded-lg border border-border object-contain sm:max-h-64"
        />
      ) : null}
      {!text && !imageUrl ? (
        <p className="text-sm text-muted-foreground">No content</p>
      ) : null}
    </div>
  );
}
