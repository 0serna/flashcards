"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ViewTransition } from "react";

import { PrivateCardImage } from "@/components/cards/private-card-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReliableAction } from "@/components/app/use-reliable-action";

import { preloadUpcomingImages } from "./preload-study-images";
import styles from "./study-session.module.css";

export type StudyCardPayload = {
  id: string;
  schedulingVersion: number;
  deckId: string;
  front: {
    text: string | null;
    imageUrl: string | null;
    imageVersion: string | null;
  };
  back: {
    text: string | null;
    imageUrl: string | null;
    imageVersion: string | null;
  };
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
    reviewId?: string,
    expectedReviewCount?: number,
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
  const [orderedCards] = useState(() => initialCards);

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
  const [endedEarly, setEndedEarly] = useState(false);
  const reliableAction = useReliableAction();
  const reviewIntentRef = useRef<{ cardId: string; id: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    preloadUpcomingImages(orderedCards, index);
  }, [orderedCards, index]);

  function handleEndSession() {
    if (studied === 0) {
      router.replace(`/decks/${deckId}`);
      return;
    }
    setEndedEarly(true);
  }

  if (orderedCards.length === 0) {
    return (
      <ViewTransition name="study-empty" default="none">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {mode === "review"
                ? "You're all caught up."
                : "This deck has no active cards."}
            </p>
            <p className="text-sm leading-6 text-muted-foreground text-balance">
              {mode === "review"
                ? "No cards are due for review right now. Come back later, or practice the deck to keep moving."
                : "Add some cards to start studying."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {mode === "review" ? (
              <Button asChild className="w-full">
                <Link
                  href={`/decks/${deckId}/study?mode=practice`}
                  prefetch={false}
                >
                  Practice anyway
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary" className="w-full">
              <Link replace href={`/decks/${deckId}`}>
                Back to {deckName}
              </Link>
            </Button>
          </div>
        </div>
      </ViewTransition>
    );
  }

  if (endedEarly || index >= orderedCards.length) {
    return (
      <ViewTransition name="study-summary" default="none">
        <div className={cn("space-y-7", styles.summaryBlock)}>
          <div className="space-y-3">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              {endedEarly ? "Session ended" : "Session complete"}
            </p>
            <p className="text-6xl font-semibold tracking-tight text-balance sm:text-7xl">
              {studied}
            </p>
            <p className="text-base leading-6 text-foreground text-balance">
              {studied === 1 ? "card" : "cards"} from {deckName}
            </p>
          </div>
          <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            {RATING_ORDER.map((rating) => (
              <div key={rating} className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">
                  {RATING_LABELS[rating]}
                </dt>
                <dd className="font-semibold text-foreground">
                  {ratingCounts[rating]}
                </dd>
              </div>
            ))}
          </dl>
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
  const total = orderedCards.length;
  const progressLabel = `Card ${index + 1} of ${total}`;

  async function handleRate(rating: StudyRating) {
    if (pending || reliableAction.pending) return;
    const intent =
      reviewIntentRef.current?.cardId === current.id
        ? reviewIntentRef.current
        : { cardId: current.id, id: crypto.randomUUID() };
    reviewIntentRef.current = intent;
    setPending(true);
    setError(null);
    setJustRated(rating);
    try {
      const attempt = await reliableAction.run(() =>
        submitRating(current.id, rating, intent.id, current.schedulingVersion),
      );
      if (!attempt) return;
      if (attempt.status === "unconfirmed") {
        setError("We could not confirm this answer. Try again safely.");
        setPending(false);
        setJustRated(null);
        return;
      }
      const result = attempt.value;
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        setJustRated(null);
        return;
      }
    } catch {
      setError("We could not confirm this answer. Try again safely.");
      setPending(false);
      setJustRated(null);
      return;
    }
    reviewIntentRef.current = null;
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
    <div className="space-y-5">
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {progressLabel}
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={handleEndSession}
            className="shrink-0"
          >
            End session
          </Button>
        </div>
      </header>

      <article
        key={current.id}
        className={styles.cardStage}
        aria-label="Study card"
      >
        <div
          className={styles.card}
          role="button"
          tabIndex={0}
          aria-pressed={revealed}
          aria-label={revealed ? "Show front" : "Show back"}
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
                label="Front"
                text={current.front.text}
                imageUrl={current.front.imageUrl}
              />
              <span className={styles.flipHint}>
                <RotateCcw aria-hidden="true" />
                Tap or click to reveal back
              </span>
            </div>
            <div
              className={`${styles.cardFace} ${styles.cardBack}`}
              aria-hidden={!revealed}
            >
              <CardFace
                label="Back"
                text={current.back.text}
                imageUrl={current.back.imageUrl}
              />
              <span className={styles.flipHint}>
                <RotateCcw aria-hidden="true" />
                Tap or click to see front
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
              variant={rating === "remembered" ? "default" : "outline"}
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
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {text ? (
        <p
          className={cn(
            "max-w-prose whitespace-pre-wrap break-words text-balance",
            styles.cardText,
          )}
        >
          {text}
        </p>
      ) : null}
      {imageUrl ? (
        <PrivateCardImage
          src={imageUrl}
          alt={`${label} image`}
          width={720}
          height={480}
        />
      ) : null}
      {!text && !imageUrl ? (
        <p className="text-sm text-muted-foreground">No content</p>
      ) : null}
    </div>
  );
}
