"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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

  if (orderedCards.length === 0) {
    return (
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
    );
  }

  if (index >= orderedCards.length) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You studied {studied} {studied === 1 ? "card" : "cards"}.
          </p>
          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            {(["forgotten", "partial", "remembered"] as const).map((rating) => (
              <div
                key={rating}
                className="rounded-lg border border-border px-2 py-3"
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
    const result = await submitRating(current.id, rating);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
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

      <article className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <CardFace
          label="Front"
          text={current.front.text}
          imageUrl={current.front.imageUrl}
        />
        {revealed ? (
          <div className="border-t border-border pt-4">
            <CardFace
              label="Back"
              text={current.back.text}
              imageUrl={current.back.imageUrl}
            />
          </div>
        ) : null}
      </article>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {revealed ? (
        <div className="grid grid-cols-1 gap-2">
          {(["forgotten", "partial", "remembered"] as const).map((rating) => (
            <Button
              key={rating}
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleRate(rating)}
            >
              {RATING_LABELS[rating]}
            </Button>
          ))}
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full"
        >
          <RotateCcw aria-hidden="true" />
          Show answer
        </Button>
      )}
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
  const [imageSize, setImageSize] = useState({ width: 720, height: 480 });

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {text ? (
        <p className="whitespace-pre-wrap break-words text-lg leading-7 text-balance">
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
          className="h-auto max-h-72 w-auto max-w-full rounded-xl border border-border object-contain"
        />
      ) : null}
      {!text && !imageUrl ? (
        <p className="text-sm text-muted-foreground">No content</p>
      ) : null}
    </div>
  );
}
