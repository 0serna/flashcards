# card-database Specification

## Purpose

TBD - created by archiving change add-database-schema. Update Purpose after archive.

## Requirements

### Requirement: User-owned deck storage

The system SHALL persist card decks in Supabase Postgres with ownership tied to Supabase Auth users.

#### Scenario: Deck table supports authenticated ownership

- **WHEN** the database schema is applied
- **THEN** the system SHALL provide a `decks` table with a user owner reference to `auth.users`, deck name, optional description, creation/update timestamps, and optional archive timestamp

#### Scenario: Deck access is scoped by owner

- **WHEN** row-level security is evaluated for deck rows
- **THEN** authenticated users SHALL only be allowed to access deck rows owned by their own Supabase Auth user id

### Requirement: Card storage with text and image references

The system SHALL persist cards inside decks with front and back content that can contain text, an image path, or both.

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

The system SHALL persist immutable review events for cards with closed rating values and scheduling snapshots.

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

### Requirement: Database connections support serverless execution

The system SHALL use separately configured runtime and migration database connections so horizontally scaled application instances cannot exhaust migration-oriented or session-oriented connection capacity.

#### Scenario: Application opens a runtime database connection

- **WHEN** a serverless application instance accesses Supabase Postgres
- **THEN** it SHALL use the bounded runtime connection pool intended for transaction-oriented serverless workloads

#### Scenario: Deployment applies database migrations

- **WHEN** the production deployment applies Drizzle or Supabase migrations
- **THEN** it SHALL use the separately configured migration connection rather than the application runtime connection

### Requirement: Created records support retry identity

The system SHALL accept caller-preassigned UUID identities for new Deck, Card, and Card Review records so repeated attempts can address the same persistent result.

#### Scenario: New record uses preassigned identity

- **WHEN** an authorized create operation supplies a valid unused UUID
- **THEN** the database service SHALL persist the new Deck, Card, or Card Review with that UUID

#### Scenario: Owned identity already exists

- **WHEN** a retry supplies the UUID of the result previously created by the same mutation intent for the authenticated user
- **THEN** the database service SHALL return the existing first confirmed result without inserting or modifying another record

#### Scenario: Identity collides outside ownership

- **WHEN** a supplied UUID already identifies data outside the authenticated user's ownership
- **THEN** the system SHALL reject the mutation without exposing the other user's data

### Requirement: Mutable records reject stale writes

The system SHALL condition Card and Deck edits and Card Review scheduling changes on the persistent version observed by the initiating interaction.

#### Scenario: Card or Deck version is current

- **WHEN** an edit supplies the current persistent version of its owned Card or Deck
- **THEN** the system SHALL apply the edit and advance its version

#### Scenario: Card or Deck version is stale

- **WHEN** an edit supplies a version that another mutation has already advanced
- **THEN** the system SHALL reject the edit without overwriting the newer state

#### Scenario: Review scheduling version is current

- **WHEN** a Review supplies the scheduling version currently stored for its active owned Card
- **THEN** the system SHALL update scheduling and insert the immutable Review in one transaction

#### Scenario: Review scheduling version is stale

- **WHEN** a distinct Review intent supplies a scheduling version another Review has already advanced
- **THEN** the system SHALL reject the stale Review without changing scheduling or inserting review history

### Requirement: Retried Card image mutations clean auxiliary resources

The system SHALL make Card mutations converge without leaving image objects that are not referenced by the confirmed Card state.

#### Scenario: Concurrent Card creation attempt loses identity race

- **WHEN** concurrent attempts upload versioned images for one Card identity and only one attempt confirms the Card row
- **THEN** the system SHALL preserve images referenced by the confirmed Card and remove images uploaded only by losing attempts

#### Scenario: Existing Card creation is retried

- **WHEN** a retry finds the owned Card identity already confirmed
- **THEN** the system SHALL return that Card without replacing its content or retaining redundant retry uploads
