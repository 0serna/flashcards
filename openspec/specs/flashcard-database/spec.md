# flashcard-database Specification

## Purpose

TBD - created by archiving change add-database-schema. Update Purpose after archive.

## Requirements

### Requirement: User-owned deck storage

The system SHALL persist flashcard decks in Supabase Postgres with ownership tied to Supabase Auth users.

#### Scenario: Deck table supports authenticated ownership

- **WHEN** the database schema is applied
- **THEN** the system SHALL provide a `decks` table with a user owner reference to `auth.users`, deck name, optional description, creation/update timestamps, and optional archive timestamp

#### Scenario: Deck access is scoped by owner

- **WHEN** row-level security is evaluated for deck rows
- **THEN** authenticated users SHALL only be allowed to access deck rows owned by their own Supabase Auth user id

### Requirement: Card storage with text and image references

The system SHALL persist flashcards inside decks with front and back content that can contain text, an image path, or both.

#### Scenario: Card table supports front and back content

- **WHEN** the database schema is applied
- **THEN** the system SHALL provide a `cards` table with a deck reference, nullable front text, nullable front image path, nullable back text, nullable back image path, current due timestamp, current ease factor, creation/update timestamps, and optional archive timestamp

#### Scenario: Card front requires content

- **WHEN** a card row is inserted or updated
- **THEN** the database SHALL reject the row unless the front has either text content or an image path

#### Scenario: Card back requires content

- **WHEN** a card row is inserted or updated
- **THEN** the database SHALL reject the row unless the back has either text content or an image path

#### Scenario: Card access follows deck ownership

- **WHEN** row-level security is evaluated for card rows
- **THEN** authenticated users SHALL only be allowed to access cards whose parent deck is owned by their own Supabase Auth user id

### Requirement: Card review history storage

The system SHALL persist immutable review events for flashcards with closed rating values and scheduling snapshots.

#### Scenario: Review table supports simplified ratings

- **WHEN** the database schema is applied
- **THEN** the system SHALL provide a `card_reviews` table whose rating value is restricted to `remembered`, `partial`, or `forgotten`

#### Scenario: Review table stores scheduling snapshot

- **WHEN** the database schema is applied
- **THEN** the `card_reviews` table SHALL store the reviewed card, reviewing user, review timestamp, previous due timestamp, next due timestamp, scheduled interval in minutes, previous ease factor, and next ease factor

#### Scenario: Review access is scoped by reviewing user

- **WHEN** row-level security is evaluated for review rows
- **THEN** authenticated users SHALL only be allowed to access review rows whose `user_id` matches their own Supabase Auth user id

### Requirement: Drizzle database source of truth

The system SHALL use Drizzle ORM schema definitions and migrations as the source of truth for the application database schema.

#### Scenario: Database schema is represented in application code

- **WHEN** the database change is implemented
- **THEN** the repository SHALL include Drizzle configuration, schema definitions, and generated migrations for the Supabase Postgres tables and enum

#### Scenario: Local checks validate database configuration

- **WHEN** the repository quality checks are run
- **THEN** the database schema and migration configuration SHALL be included without TypeScript, lint, or test failures
