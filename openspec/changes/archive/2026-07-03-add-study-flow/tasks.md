## 1. Database and Scheduling Model

- [x] 1.1 Add `review_count` and `interval_minutes` to the Drizzle `cards` schema with safe defaults for existing flashcards.
- [x] 1.2 Generate and verify the database migration for the new scheduling state columns.
- [x] 1.3 Add tests that validate the updated card schema and migration expectations.
- [x] 1.4 Add a pure scheduler module that maps `forgotten`, `partial`, and `remembered` to the v1 SM-2 adaptation.
- [x] 1.5 Add scheduler tests for ease-factor changes, minimum ease, review count behavior, intervals, and next due timestamps.

## 2. Study Services

- [x] 2.1 Add service behavior for listing due review flashcards from an owned active deck ordered by oldest `due_at` first.
- [x] 2.2 Add service behavior for listing active practice flashcards from an owned active deck.
- [x] 2.3 Add service behavior for computing due-now counts for active decks and deck detail summaries.
- [x] 2.4 Add transactional review persistence that inserts `card_reviews` and updates `cards` scheduling state together.
- [x] 2.5 Add service tests for unauthenticated ownership boundaries, archived resources, queue ordering, due filtering, and transactional review writes.

## 3. API Routes

- [x] 3.1 Add tests for unauthenticated and unauthorized study queue requests.
- [x] 3.2 Implement `GET /api/decks/[deckId]/study?mode=review|practice` for study queues.
- [x] 3.3 Add tests for valid and invalid review rating submissions.
- [x] 3.4 Implement `POST /api/decks/[deckId]/cards/[cardId]/reviews` for rating persistence.
- [x] 3.5 Ensure API errors follow the existing JSON error shape and return 404 for missing, archived, unowned, or wrong-deck resources.

## 4. Study UI

- [x] 4.1 Add a deck-level study entry point that shows due-now count and starts review when due flashcards exist.
- [x] 4.2 Add a no-due state that offers practice without implying overdue work.
- [x] 4.3 Add `/decks/[deckId]/study` UI for front-first flashcard study, answer reveal, and rating actions.
- [x] 4.4 Shuffle practice queues once per client-side session and keep review queues in API order.
- [x] 4.5 Add a completion summary with studied count and navigation back to the deck.
- [x] 4.6 Add or update UI tests for reveal/rating flow, practice fallback, completion, and deck navigation.

## 5. Deck Summaries and Quality Gates

- [x] 5.1 Update deck list and deck detail summaries to show due-now counts without gamified statistics.
- [x] 5.2 Update existing flashcard creation behavior/tests to confirm new flashcards are immediately due.
- [x] 5.3 Run formatting, lint, typecheck, tests, database checks, and the repository check suite.
