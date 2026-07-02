## Context

The repository already has a Supabase-backed database schema for user-owned decks, cards, and review history. The authenticated app shell still uses mocked deck data, and there is no runtime database access layer or API surface for deck mutations. This change adds only the backend API needed for deck CRUD, using the existing `decks` table and Supabase Auth session.

## Goals / Non-Goals

**Goals:**

- Provide REST route handlers for active deck CRUD under `/api/decks`.
- Require authentication for every deck operation.
- Scope every query and mutation to the authenticated user's `user_id`.
- Validate request bodies for deck creation and updates.
- Archive decks with `archived_at` instead of deleting rows.
- Return simple JSON responses with standard HTTP status codes.

**Non-Goals:**

- No deck UI, forms, navigation, or mocked homepage replacement.
- No card CRUD or review scheduling API.
- No database schema or migration changes.
- No unique deck-name constraint.
- No archived-deck browsing or restore endpoint.

## Decisions

### Use Route Handlers instead of Server Actions

The API is backend-only and should be consumable independently from future UI components, so Next.js Route Handlers are a better fit than Server Actions. Server Actions can be introduced later as UI glue if needed, but the REST contract remains the backend boundary.

### Use soft delete for DELETE

`DELETE /api/decks/[id]` will set `archived_at` and refresh `updated_at`. This matches the existing schema and avoids destructive deletion while keeping the active CRUD API simple.

### Treat archived decks as unavailable

List and read operations will filter `archived_at IS NULL`. Updating or deleting an archived deck through this API will behave like a missing resource. This keeps the active deck API consistent and avoids adding archive-management semantics now.

### Keep request and error contracts small

Create and update requests accept only `name` and `description`. Errors use `{ "error": string }` with status codes such as `401`, `404`, and `400`. Field-level error envelopes are intentionally deferred until the UI needs them.

### Use explicit ownership filters in addition to RLS

RLS is already part of the database schema, but route handlers will also filter by the authenticated user's id. This makes authorization visible in application code and keeps tests focused on expected behavior.

## Risks / Trade-offs

- Duplicate deck names can confuse users later → Accept for now because the database has no uniqueness constraint and the product has not required one.
- Soft-deleted rows remain in storage → Mitigated by filtering active endpoints with `archived_at IS NULL`.
- Simple error responses provide limited validation detail → Accept for the backend-only slice; richer field errors can be added when UI requirements are known.
- Adding a database client introduces environment-variable expectations at runtime → Keep configuration minimal and covered by TypeScript/tests.
