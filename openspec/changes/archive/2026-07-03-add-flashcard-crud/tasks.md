## 1. Storage and validation foundation

- [x] 1.1 Add private flashcard image storage configuration, bucket policy/migration, and constants for bucket name, signed URL expiry, allowed MIME types, and 5 MB limit.
- [x] 1.2 Add flashcard Zod schemas for ids, text fields, multipart payload parsing, image validation, and side-content validation.
- [x] 1.3 Add tests for flashcard validation schemas, including text trimming, missing side content, invalid image type, and oversized images.

## 2. Flashcard service layer

- [x] 2.1 Implement card row mapping with persisted image paths and optional signed image URLs.
- [x] 2.2 Implement active and archived flashcard listing scoped to owned active decks, ordered newest first.
- [x] 2.3 Implement create, retrieve, update, archive, and restore service functions with deck ownership checks.
- [x] 2.4 Implement private image upload, signed URL creation, and image cleanup for replacement/removal.
- [x] 2.5 Add service tests for ownership, active/archive filters, image paths, signed URLs, and cleanup behavior.

## 3. Flashcard API

- [x] 3.1 Add route tests for unauthenticated and missing/unowned/archived deck access across flashcard endpoints.
- [x] 3.2 Add `GET` and `POST /api/decks/[deckId]/cards` for active listing and multipart creation.
- [x] 3.3 Add `GET`, `PATCH`, and `DELETE /api/decks/[deckId]/cards/[cardId]` for retrieval, multipart update, and archive.
- [x] 3.4 Add archived list and restore API routes for deck flashcards.
- [x] 3.5 Verify flashcard API errors use the existing JSON error shape.

## 4. Flashcard UI and actions

- [x] 4.1 Replace the mocked new-card flow with real create actions, including save and save-and-add-another behavior.
- [x] 4.2 Add shared flashcard form UI for text and image inputs, edit defaults, image replacement, and image removal.
- [x] 4.3 Update deck detail to show real active flashcard count and compact active flashcard list with edit/archive actions.
- [x] 4.4 Add flashcard edit page at `/decks/[deckId]/cards/[cardId]/edit`.
- [x] 4.5 Add archived flashcards page for a deck with restore actions.
- [x] 4.6 Add UI flow tests for create, edit, archive, archived listing, restore, and real deck counts.

## 5. Quality gates

- [x] 5.1 Run database checks after storage/migration changes.
- [x] 5.2 Run lint, typecheck, tests, and full local check suite.
- [x] 5.3 Fix all reported issues without suppressing warnings.
