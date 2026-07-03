## Context

The app already has authenticated deck CRUD, Drizzle-backed `cards` rows, and a mocked first-card form. The missing layer is application behavior: validated card services, REST routes, UI forms, real deck counts, and private image upload/display through Supabase Storage.

## Goals / Non-Goals

**Goals:**

- Follow the existing deck CRUD architecture: Zod schemas, service functions, authenticated route handlers, server actions, and tests.
- Manage flashcards only within owned active decks.
- Support text and/or image content on both front and back sides.
- Use a private Supabase Storage bucket and signed URLs for display.
- Keep active and archived flashcard flows consistent with deck archive/restore behavior.

**Non-Goals:**

- No study/repetition algorithm or `due` summary behavior.
- No rich text or Markdown editing.
- No physical card deletion flow.
- No image transformations or client-side cropping.

## Decisions

### Use nested deck/card boundaries

Flashcard routes and UI remain nested under decks (`/decks/[deckId]/cards` and `/api/decks/[deckId]/cards`) because deck ownership is the domain and access boundary. A flat `/api/cards/[id]` API would still need deck ownership joins and would make the boundary less explicit.

### Accept multipart writes for flashcard mutations

Create and update endpoints will accept `multipart/form-data` so text fields and optional image uploads travel in one request. JSON plus separate upload would make partial failure handling visible to callers and require extra client orchestration before there is a separate media management model.

### Persist paths and return signed URLs

Card rows will keep only storage object paths. Read responses will include one-hour signed URLs when images exist, keeping private media display simple while avoiding public object URLs.

### Keep archival non-destructive

Archiving a flashcard sets `archived_at` and keeps text and images. Replacing or removing an image during edit deletes the previous object because the user intentionally changed that content and stale private media should not accumulate.

### Replace card mocks with real active counts only

The deck detail summary will show real active flashcard counts but will not calculate `due` yet. Due behavior belongs to the future repetition algorithm, not CRUD.

## Risks / Trade-offs

- Private Storage policies can be misconfigured → Add targeted SQL/configuration and tests where practical; keep paths scoped by user/deck/card.
- Multipart route tests are more involved than JSON route tests → Keep parsing isolated behind card schemas/services.
- Deleting replaced image objects can fail after row update → Perform object cleanup deliberately and surface failures instead of silently ignoring them.
- Signed URLs expire while a page is open → Use a one-hour expiry, acceptable for CRUD screens; future study flows can refresh as needed.
