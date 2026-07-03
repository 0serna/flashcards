## ADDED Requirements

### Requirement: Authenticated flashcard API access

The system SHALL require a Supabase-authenticated user for every flashcard CRUD API operation.

#### Scenario: Unauthenticated flashcard request

- **WHEN** a request is made to a flashcard API endpoint without an authenticated user
- **THEN** the system SHALL respond with 401 and an error JSON object

### Requirement: Active flashcard listing

The system SHALL allow authenticated users to list active flashcards inside an owned active deck, ordered by most recently created first.

#### Scenario: User lists active flashcards

- **WHEN** an authenticated user requests `GET /api/decks/[deckId]/cards` for an owned active deck
- **THEN** the system SHALL respond with non-archived flashcards for that deck ordered newest first

#### Scenario: Missing archived or unowned deck is hidden

- **WHEN** an authenticated user requests active flashcards for a missing, archived, or unowned deck
- **THEN** the system SHALL respond with 404

### Requirement: Flashcard creation

The system SHALL allow authenticated users to create flashcards in an owned active deck with front and back content where each side has text, an image, or both.

#### Scenario: User creates a text flashcard

- **WHEN** an authenticated user submits valid front and back text to `POST /api/decks/[deckId]/cards`
- **THEN** the system SHALL create an active flashcard in that deck and respond with the created flashcard

#### Scenario: User creates a flashcard with images

- **WHEN** an authenticated user submits valid JPEG, PNG, or WebP images no larger than 5 MB for either side
- **THEN** the system SHALL upload the images privately, store their paths on the flashcard, and respond with signed image URLs

#### Scenario: User submits incomplete flashcard content

- **WHEN** an authenticated user submits a flashcard where the front or back lacks both text and image content
- **THEN** the system SHALL reject the request with 400 and an error JSON object

### Requirement: Active flashcard retrieval and signed image display

The system SHALL allow authenticated users to retrieve one active flashcard from an owned active deck, including signed image URLs when image paths exist.

#### Scenario: User retrieves an active flashcard

- **WHEN** an authenticated user requests `GET /api/decks/[deckId]/cards/[cardId]` for an active flashcard in an owned active deck
- **THEN** the system SHALL respond with that flashcard and one-hour signed URLs for existing images

#### Scenario: Missing archived or unowned flashcard is hidden

- **WHEN** an authenticated user requests a missing, archived, or unowned flashcard
- **THEN** the system SHALL respond with 404

### Requirement: Active flashcard update

The system SHALL allow authenticated users to update text and image content for an active flashcard in an owned active deck.

#### Scenario: User updates flashcard text

- **WHEN** an authenticated user submits valid updated text for an active flashcard
- **THEN** the system SHALL update the flashcard and respond with the updated flashcard

#### Scenario: User replaces a flashcard image

- **WHEN** an authenticated user uploads a replacement image for an existing side image
- **THEN** the system SHALL store the new private image, update the flashcard path, and delete the previous image object

#### Scenario: User removes a flashcard image

- **WHEN** an authenticated user removes an existing side image while that side retains text content
- **THEN** the system SHALL clear the image path and delete the removed image object

#### Scenario: Update would leave a side empty

- **WHEN** an authenticated user updates a flashcard so the front or back would lack both text and image content
- **THEN** the system SHALL reject the request with 400 and keep the existing flashcard unchanged

### Requirement: Active flashcard archive

The system SHALL archive flashcards instead of physically deleting card rows.

#### Scenario: User archives an active flashcard

- **WHEN** an authenticated user requests `DELETE /api/decks/[deckId]/cards/[cardId]` for an active flashcard in an owned active deck
- **THEN** the system SHALL set the flashcard archive timestamp and respond with a successful JSON response

#### Scenario: Archived image content is retained

- **WHEN** a flashcard with image content is archived
- **THEN** the system SHALL keep its stored image objects and image paths

### Requirement: Archived flashcard management

The system SHALL allow authenticated users to list and restore archived flashcards for an owned active deck.

#### Scenario: User lists archived flashcards

- **WHEN** an authenticated user requests archived flashcards for an owned active deck
- **THEN** the system SHALL respond with archived flashcards ordered newest first

#### Scenario: User restores an archived flashcard

- **WHEN** an authenticated user restores an archived flashcard in an owned active deck
- **THEN** the system SHALL clear the archive timestamp and make the flashcard active again

### Requirement: Flashcard management UI

The system SHALL provide UI flows for managing flashcards within a deck.

#### Scenario: Deck detail lists active flashcards

- **WHEN** a user opens an owned active deck
- **THEN** the page SHALL show active flashcards with compact front and back content, newest first

#### Scenario: User creates a flashcard from the deck

- **WHEN** a user opens the new flashcard page for an owned active deck
- **THEN** the page SHALL allow front and back text and image input with actions to save or save and add another

#### Scenario: User edits a flashcard

- **WHEN** a user opens `/decks/[deckId]/cards/[cardId]/edit` for an active flashcard
- **THEN** the page SHALL allow updating text, replacing images, and removing images when that side keeps text content

#### Scenario: User archives a flashcard from the deck

- **WHEN** a user activates the archive action for an active flashcard in the deck list
- **THEN** the system SHALL archive it directly without a confirmation step

#### Scenario: User manages archived flashcards

- **WHEN** a user opens the archived flashcards view for a deck
- **THEN** the page SHALL list archived flashcards and offer restore actions

### Requirement: Real flashcard deck summary

The system SHALL show real active flashcard counts on deck screens instead of mocked card summaries.

#### Scenario: Deck summary shows active count

- **WHEN** a user opens a deck with active flashcards
- **THEN** the deck summary SHALL show the real count of active flashcards and SHALL NOT show due-card counts
