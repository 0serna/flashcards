## Why

The app can create and manage decks, but flashcards are still mocked in the deck flow even though the database already has card storage. Adding flashcard CRUD now turns decks into useful study material containers and establishes the private image workflow needed by card content.

## What Changes

- Add authenticated REST endpoints for listing, creating, reading, updating, archiving, listing archived, and restoring flashcards within a deck.
- Add UI flows for creating, editing, archiving, listing active, listing archived, and restoring flashcards.
- Replace mocked deck card summaries with real active flashcard counts.
- Support text and private image content on both flashcard sides.
- Configure private Supabase Storage for flashcard images with JPEG, PNG, and WebP uploads up to 5 MB.
- Return signed image URLs for display while persisting only image paths on flashcards.

## Capabilities

### New Capabilities

- `flashcard-crud`: Authenticated flashcard management, private image upload/display, active and archived flashcard flows.

### Modified Capabilities

- `flashcard-database`: Flashcard image references become backed by a private Supabase Storage bucket and app-level signed URL behavior.

## Impact

- Affected code: `src/app/decks`, `src/app/api`, `src/lib/cards`, `src/lib/db`, `src/lib/supabase`, tests.
- Affected APIs: new nested `/api/decks/[deckId]/cards` endpoints and restore endpoints.
- Affected systems: Supabase Postgres `cards` table, Supabase Storage bucket configuration/policies, deck detail UI.
