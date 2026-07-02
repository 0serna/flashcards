## Why

Deck data is currently persisted in the database schema but there is no backend API for the application to create, read, update, or archive user decks. Adding a narrow authenticated CRUD API unlocks future UI work without changing the existing database model.

## What Changes

- Add authenticated REST route handlers for deck CRUD under `/api/decks`.
- Allow authenticated users to list active decks, create decks, read an active deck by id, update deck name/description, and archive a deck.
- Scope all deck operations to the current Supabase Auth user.
- Return simple JSON responses and standard HTTP status codes.
- Treat archived decks as unavailable through the active CRUD API.

## Capabilities

### New Capabilities

- `deck-crud-api`: Authenticated REST API behavior for user-owned deck CRUD operations.

### Modified Capabilities

## Impact

- Affected code: Next.js App Router route handlers, Supabase server auth integration, database access helpers, request validation, and API tests.
- Affected APIs: new `/api/decks` and `/api/decks/[id]` endpoints.
- Dependencies: no new runtime dependency is expected; existing Supabase, Drizzle, and Zod packages are sufficient.
