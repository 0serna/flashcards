## Context

The app has a protected authenticated shell backed by Supabase Auth, but deck data on the home page is currently mocked. The next backend foundation is persistent Supabase Postgres storage for user-owned decks, cards, and review history. The implementation must stay narrow: configure database tooling and create the schema only, without adding UI flows, CRUD behavior, image upload, or repetition algorithm execution.

## Goals / Non-Goals

**Goals:**

- Use Drizzle as the source of truth for the application database schema and migrations.
- Create `decks`, `cards`, and `card_reviews` tables in Supabase Postgres.
- Model ownership through Supabase Auth users without introducing an app-specific profiles table.
- Allow each card side to contain text, an image path, or both.
- Persist enough scheduling state for future study behavior: the current `cards.due_at` and immutable review snapshots.
- Enable row-level security so authenticated users can only access their own data.

**Non-Goals:**

- No deck/card UI or route changes.
- No Server Actions or Route Handlers for CRUD.
- No Supabase Storage bucket, upload flow, or Storage policies.
- No spaced-repetition algorithm implementation.
- No `profiles` table.

## Decisions

### Use Drizzle schema and migrations

Drizzle will define the tables, enum, indexes, and constraints, with generated migrations applied to Supabase Postgres. This keeps the TypeScript schema and database migrations aligned. SQL-only migrations were considered, but they would split the schema source of truth away from the application code.

### Keep ownership on `decks`

`decks.user_id` references `auth.users(id)` and is the primary ownership boundary. Cards inherit ownership through their deck. This avoids duplicating `user_id` on every card while still allowing RLS policies to enforce access through the parent deck.

### Store `user_id` on `card_reviews`

`card_reviews.user_id` is explicit even though ownership can be derived through `card_id -> deck_id -> user_id`. This makes user history queries and RLS policies simpler, and supports future statistics without requiring repeated joins.

### Store card content as nullable text and image path fields

Cards will use `front_text`, `front_image_path`, `back_text`, and `back_image_path`. Database constraints will require each side to have at least text or an image path. The paths are storage references, not public URLs, so future Storage configuration can choose private or signed URL behavior without migrating card rows.

### Keep `cards` state minimal

`cards` stores `due_at` as the current scheduling state. It does not store `interval_days`, `repetitions`, or `lapses` because those are derivable from review history and add synchronization risk. The current ease factor is retained as scheduling state for future algorithm use.

### Store review snapshots immutably

`card_reviews` records `rating`, `reviewed_at`, `previous_due_at`, `next_due_at`, `scheduled_minutes`, `previous_ease_factor`, and `next_ease_factor`. This preserves the result of each future scheduling decision without bloating the current `cards` row.

### Use a Postgres enum for ratings

The review rating values are closed to `remembered`, `partial`, and `forgotten`. A Postgres enum prevents invalid historical review data and matches the simplified product language.

## Risks / Trade-offs

- RLS policies for cards require ownership checks through `decks` → Keep policies explicit and covered by migration tests or SQL inspection.
- Image paths can exist before Storage is configured → Treat them as opaque references until the future Storage change adds buckets and policies.
- Review snapshots can disagree with card state if future write logic is not transactional → Future review writes should update `cards` and insert `card_reviews` in one transaction.
- Removing counters such as `repetitions` and `lapses` may require aggregate queries later → Accept for now because it avoids premature denormalization and inconsistency.
