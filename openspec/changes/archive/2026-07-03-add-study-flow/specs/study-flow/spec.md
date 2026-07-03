## ADDED Requirements

### Requirement: Authenticated study access

The system SHALL require a Supabase-authenticated user for every study queue and review rating operation.

#### Scenario: Unauthenticated study request

- **WHEN** a request is made to a study endpoint without an authenticated user
- **THEN** the system SHALL respond with 401 and SHALL NOT expose study material

#### Scenario: Missing archived or unowned deck is hidden

- **WHEN** an authenticated user requests a study queue for a missing, archived, or unowned deck
- **THEN** the system SHALL respond with 404

### Requirement: Review queue

The system SHALL provide a review queue containing active flashcards from an owned active deck whose due timestamp is at or before the server's current time.

#### Scenario: User starts review with due flashcards

- **WHEN** an authenticated user starts review for an owned active deck with due active flashcards
- **THEN** the system SHALL return due active flashcards ordered by oldest due timestamp first

#### Scenario: User starts review with no due flashcards

- **WHEN** an authenticated user starts review for an owned active deck with no due active flashcards
- **THEN** the system SHALL return an empty review queue and SHALL allow the UI to offer practice

#### Scenario: Archived flashcards are excluded from review

- **WHEN** an authenticated user starts review for an owned active deck that contains archived flashcards
- **THEN** the system SHALL exclude archived flashcards from the review queue

### Requirement: Practice queue

The system SHALL provide a practice queue containing active flashcards from an owned active deck outside the due-only review queue.

#### Scenario: User starts practice

- **WHEN** an authenticated user starts practice for an owned active deck
- **THEN** the system SHALL return active flashcards for that deck without requiring them to be due

#### Scenario: Practice order is randomized per session

- **WHEN** the user starts a practice session
- **THEN** the UI SHALL shuffle the practice queue once and keep that order stable for the current session

### Requirement: Study card interaction

The system SHALL show each studied flashcard as a front prompt first, then reveal the back answer before accepting a rating.

#### Scenario: User reveals an answer

- **WHEN** a user opens a flashcard in a study session
- **THEN** the UI SHALL show the front content and hide the back content until the user chooses to reveal the answer

#### Scenario: User rates a revealed answer

- **WHEN** a user reveals the answer for a flashcard
- **THEN** the UI SHALL offer `forgotten`, `partial`, and `remembered` rating actions

### Requirement: Review rating persistence

The system SHALL persist each flashcard rating by inserting immutable review history and updating the flashcard scheduling state as one transaction.

#### Scenario: User rates a flashcard

- **WHEN** an authenticated user rates an active flashcard inside an owned active deck
- **THEN** the system SHALL create a `card_reviews` row with previous and next scheduling snapshots and update the flashcard's current scheduling state

#### Scenario: Review write uses server time

- **WHEN** the system calculates the next due timestamp for a rating
- **THEN** the system SHALL use server time as the scheduling reference

#### Scenario: Missing archived or unowned flashcard is hidden

- **WHEN** an authenticated user rates a missing, archived, unowned, or wrong-deck flashcard
- **THEN** the system SHALL respond with 404 and SHALL NOT create a review

#### Scenario: Saved rating is final

- **WHEN** a rating has been saved for a flashcard
- **THEN** the system SHALL NOT provide an undo or review-edit operation in this flow

### Requirement: Spaced repetition scheduling

The system SHALL schedule rated flashcards using the product's three-rating SM-2 adaptation.

#### Scenario: User forgets a flashcard

- **WHEN** a user rates a flashcard as `forgotten`
- **THEN** the system SHALL schedule it 10 minutes after server time, reset its review count to 0, set its interval to 10 minutes, and update ease factor using SM-2 quality 0 with a minimum ease factor of 1.3

#### Scenario: User partially remembers a flashcard

- **WHEN** a user rates a flashcard as `partial`
- **THEN** the system SHALL schedule it 1 day after server time, keep its review count from resetting, set its interval to 1440 minutes, and update ease factor using SM-2 quality 3 with a minimum ease factor of 1.3

#### Scenario: User remembers a new flashcard

- **WHEN** a user rates a flashcard as `remembered` and it has no prior successful interval
- **THEN** the system SHALL schedule it 3 days after server time, set its interval to 4320 minutes, increment its review count, and update ease factor using SM-2 quality 5 with a minimum ease factor of 1.3

#### Scenario: User remembers a reviewed flashcard

- **WHEN** a user rates a flashcard as `remembered` and it has a prior interval
- **THEN** the system SHALL schedule it after the current interval multiplied by the new ease factor, store that interval in minutes, increment its review count, and update ease factor using SM-2 quality 5 with a minimum ease factor of 1.3

### Requirement: Study completion

The system SHALL provide a calm completion state after the user rates the final flashcard in the current study queue.

#### Scenario: User finishes a study session

- **WHEN** the user rates the last flashcard in the current study queue
- **THEN** the UI SHALL show a simple summary with the number of studied flashcards and a way to return to the deck

### Requirement: Due-now deck summaries

The system SHALL show due-now counts for decks without adding gamified progress or historical statistics.

#### Scenario: User views deck summaries

- **WHEN** an authenticated user views the deck list or a deck detail page
- **THEN** the UI SHALL show the number of active flashcards due now for each displayed deck

#### Scenario: New flashcard is immediately due

- **WHEN** a user creates a new flashcard
- **THEN** the flashcard SHALL be eligible for review immediately unless it is archived
