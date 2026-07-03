## Why

Decks and flashcards can be managed, but users still cannot study them or persist recall outcomes. Adding the study flow now turns stored flashcards into the core product experience and uses the existing review-history foundation.

## What Changes

- Add a deck-level study flow with two modes: due-only review and manual practice.
- Show flashcard fronts first, reveal the answer, then collect one of three ratings: `forgotten`, `partial`, or `remembered`.
- Persist every rating as immutable review history and update the flashcard's spaced-repetition state in the same write.
- Add explicit flashcard scheduling state for `review_count` and `interval_minutes` alongside existing `due_at` and `ease_factor`.
- Add study queue and review APIs scoped to owned active decks and active flashcards.
- Add due-now counts on deck screens without adding streaks, scores, or historical statistics.

## Capabilities

### New Capabilities

- `study-flow`: Deck-level review and practice behavior, study UI, study queue API, rating persistence, and due-now summaries.

### Modified Capabilities

- `flashcard-database`: Flashcard rows store explicit spaced-repetition state required by the study scheduler.

## Impact

- Affected code: `src/app/decks`, `src/app/api`, `src/lib/cards`, `src/lib/decks`, `src/lib/db`, tests.
- Affected APIs: new study queue endpoint and card review endpoint under owned deck/card boundaries.
- Affected systems: Supabase Postgres `cards` table, Drizzle schema, generated migrations, immutable `card_reviews` writes.
