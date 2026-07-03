# SRS state and SM-2 adaptation

The study flow persists spaced-repetition state on each flashcard with `review_count`, `interval_minutes`, `ease_factor`, and `due_at`, instead of deriving scheduling only from review history. We adapt SM-2 to the product's three ratings (`forgotten`, `partial`, `remembered`) so review writes are simple, auditable, and transactional while avoiding a saved study-session model.

## Considered Options

- Derive scheduling from the latest review snapshot only.
- Store explicit SRS state on each flashcard.
- Implement pure SM-2 with a 0–5 user-facing rating scale.

## Consequences

Changing the scheduling model later will require a migration or backfill for flashcard scheduling state.
