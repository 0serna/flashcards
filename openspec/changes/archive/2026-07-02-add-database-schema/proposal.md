## Why

The app currently has authentication and a mocked deck home, but no persistent data model for decks, cards, or study reviews. Adding the database foundation now enables future CRUD and study flows to build on a stable Supabase Postgres schema with row-level security.

## What Changes

- Add Drizzle ORM as the source of truth for the application database schema and migrations.
- Add Supabase Postgres tables for decks, cards, and card review history.
- Add support for text and image-path content on both sides of a card.
- Add basic scheduling fields needed by future spaced-repetition behavior.
- Add basic row-level security policies so authenticated users can only access their own data.
- Do not add UI, CRUD flows, Supabase Storage buckets, Storage policies, or the repetition algorithm execution in this change.

## Capabilities

### New Capabilities

- `flashcard-database`: Covers the persistent Supabase Postgres schema for user-owned decks, cards, card review history, card content validation, rating values, and row-level data access.

### Modified Capabilities

## Impact

- Affected systems: Supabase Postgres, Supabase Auth user ownership, Drizzle ORM schema and migrations.
- Affected code: database configuration, schema definitions, generated migrations, and migration-related scripts/configuration.
- New dependencies: Drizzle ORM and migration tooling as needed for Supabase Postgres.
- No route, UI, authentication flow, or Storage behavior changes are introduced.
