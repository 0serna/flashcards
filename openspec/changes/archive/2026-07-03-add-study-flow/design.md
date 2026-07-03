## Context

The app already has authenticated deck and flashcard CRUD, private flashcard images, `cards.due_at`, `cards.ease_factor`, and immutable `card_reviews`. The missing layer is the actual study behavior: selecting flashcards, revealing answers, recording recall ratings, and updating scheduling state.

The domain language separates due-only `Review` from manual `Practice`. A `Study session` is an ephemeral user experience, not a persisted domain object; each answer is saved independently as review history.

## Goals / Non-Goals

**Goals:**

- Add a deck-level study UI for review and practice.
- Persist each rating transactionally by inserting `card_reviews` and updating the flashcard scheduling state.
- Add `review_count` and `interval_minutes` to make scheduling explicit and auditable.
- Surface due-now counts on deck screens so the next study action is clear.
- Keep the experience calm and non-gamified.

**Non-Goals:**

- No saved `study_sessions` table or resumable session history.
- No streaks, scores, badges, or detailed statistics.
- No typed-answer validation or automatic correctness checking.
- No advanced memory model such as FSRS or stochastic optimization.
- No reviews for archived decks, archived flashcards, or unowned flashcards.

## Decisions

### Store explicit SRS state on flashcards

Flashcards will store `review_count` and `interval_minutes` alongside existing `due_at` and `ease_factor`. This avoids deriving mutable scheduling state from review history on every answer and makes review writes simple to reason about.

Alternative considered: derive the next interval from the latest `card_reviews.scheduled_minutes`. Rejected because the current scheduling state would be implicit and harder to validate or migrate.

### Adapt SM-2 to the product's three ratings

The scheduler maps ratings to SM-2 quality values: `forgotten = 0`, `partial = 3`, `remembered = 5`. Ease factor uses the SM-2 formula with a floor of `1.3`. A new flashcard starts at ease `2.5`, review count `0`, interval `0`, and due now.

Scheduling behavior:

- `forgotten`: next due in 10 minutes, `review_count` resets to `0`, `interval_minutes` becomes `10`, ease decreases through the SM-2 formula.
- `partial`: next due in 1 day, `review_count` does not reset, `interval_minutes` becomes `1440`, ease decreases through the SM-2 formula.
- `remembered`: first remembered interval is 3 days; later remembered intervals multiply the current interval by the new ease factor and increment `review_count`.

Alternative considered: expose a pure 0-5 SM-2 scale. Rejected because the product already uses three simple ratings and should avoid unnecessary cognitive load.

### Keep study sessions ephemeral

The UI will build a queue when the user starts studying. Review queues are ordered by oldest `due_at`; practice queues include active flashcards and are shuffled once when practice starts. Progress is client-side only, while every rating is persisted immediately.

Alternative considered: persist `study_sessions` with queue order and progress. Rejected for v1 because it adds recovery and lifecycle complexity without being necessary for reliable review history.

### Use nested deck/card boundaries

Study APIs remain scoped under decks and cards. Queue access requires an owned active deck; review writes require an active flashcard inside that owned active deck. Missing, archived, and unowned resources return 404.

### Add due-now summaries only

Deck screens will show active flashcard counts and due-now counts. The app will not add streaks, scores, or historical analytics in this change.

## Risks / Trade-offs

- Scheduling rules may need future tuning → Keep state explicit and record review snapshots for migration/backfill.
- Client-side ephemeral queues can be lost on reload → Ratings are saved immediately, and users can restart a fresh queue.
- Practice can change due dates even when a flashcard was not due → Treat practice answers as real recall outcomes and persist them like review answers.
- Transaction support in service tests can be awkward → Keep scheduling calculation pure and isolate the transactional write in the service layer.

## Migration Plan

1. Add nullable-safe defaults for `cards.review_count` and `cards.interval_minutes` through Drizzle schema and migration.
2. Existing flashcards receive `review_count = 0` and `interval_minutes = 0`; existing `due_at` and `ease_factor` are preserved.
3. Deploy service/API/UI changes after the schema is available.
4. Rollback can leave the added columns unused; no destructive data migration is required.

## Open Questions

None.
