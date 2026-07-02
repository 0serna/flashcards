## 1. Database tooling setup

- [x] 1.1 Add Drizzle ORM and migration tooling dependencies for Supabase Postgres.
- [x] 1.2 Add Drizzle configuration using the Supabase database connection environment variable.
- [x] 1.3 Add npm scripts needed to generate and apply database migrations.

## 2. Schema definitions

- [x] 2.1 Define the `card_review_rating` Postgres enum with `remembered`, `partial`, and `forgotten` values.
- [x] 2.2 Define the `decks` table with Supabase Auth ownership, timestamps, archive timestamp, and useful owner indexes.
- [x] 2.3 Define the `cards` table with deck ownership, front/back text and image path fields, scheduling state, timestamps, archive timestamp, and content constraints.
- [x] 2.4 Define the `card_reviews` table with explicit reviewing user, rating enum, scheduling snapshots, ease factor snapshots, timestamp, and useful lookup indexes.

## 3. Migrations and RLS

- [x] 3.1 Generate the initial Drizzle migration for the enum, tables, constraints, indexes, and foreign keys.
- [x] 3.2 Add migration SQL for enabling row-level security on `decks`, `cards`, and `card_reviews`.
- [x] 3.3 Add RLS policies that scope `decks` by `user_id = auth.uid()`.
- [x] 3.4 Add RLS policies that scope `cards` through ownership of the parent deck.
- [x] 3.5 Add RLS policies that scope `card_reviews` by `user_id = auth.uid()`.

## 4. Verification

- [x] 4.1 Add schema or migration tests/inspection checks for required tables, fields, enum values, constraints, and RLS statements.
- [x] 4.2 Run the repository quality checks and fix any TypeScript, lint, or test failures.
