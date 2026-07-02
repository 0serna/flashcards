## ADDED Requirements

### Requirement: Authenticated deck API access

The system SHALL require a Supabase-authenticated user for every deck CRUD API operation.

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request is made to a deck CRUD API endpoint without an authenticated user
- **THEN** the system SHALL respond with HTTP 401 and a JSON error response

### Requirement: Active deck listing

The system SHALL provide an endpoint for authenticated users to list their active decks.

#### Scenario: User lists active decks

- **WHEN** an authenticated user requests `GET /api/decks`
- **THEN** the system SHALL respond with only non-archived decks owned by that user

#### Scenario: Archived decks are excluded from list

- **WHEN** an authenticated user requests `GET /api/decks`
- **THEN** the system SHALL NOT include decks whose `archived_at` value is set

### Requirement: Deck creation

The system SHALL allow authenticated users to create decks with a required name and optional description.

#### Scenario: User creates a deck

- **WHEN** an authenticated user requests `POST /api/decks` with a valid `name` and optional `description`
- **THEN** the system SHALL create a deck owned by that user and respond with the created deck

#### Scenario: Invalid create payload is rejected

- **WHEN** an authenticated user requests `POST /api/decks` without a valid `name`
- **THEN** the system SHALL respond with HTTP 400 and a JSON error response

### Requirement: Active deck retrieval

The system SHALL allow authenticated users to retrieve one active deck they own by id.

#### Scenario: User retrieves an owned active deck

- **WHEN** an authenticated user requests `GET /api/decks/[id]` for a non-archived deck they own
- **THEN** the system SHALL respond with that deck

#### Scenario: Missing, archived, or unowned deck is hidden

- **WHEN** an authenticated user requests `GET /api/decks/[id]` for a missing, archived, or unowned deck
- **THEN** the system SHALL respond with HTTP 404 and a JSON error response

### Requirement: Active deck update

The system SHALL allow authenticated users to update the name and description of one active deck they own.

#### Scenario: User updates an owned active deck

- **WHEN** an authenticated user requests `PATCH /api/decks/[id]` with a valid `name` or `description` for a non-archived deck they own
- **THEN** the system SHALL update the deck and respond with the updated deck

#### Scenario: Invalid update payload is rejected

- **WHEN** an authenticated user requests `PATCH /api/decks/[id]` with an invalid `name` or unsupported fields
- **THEN** the system SHALL respond with HTTP 400 and a JSON error response

#### Scenario: Archived or unowned deck cannot be updated

- **WHEN** an authenticated user requests `PATCH /api/decks/[id]` for an archived or unowned deck
- **THEN** the system SHALL respond with HTTP 404 and a JSON error response

### Requirement: Active deck archive

The system SHALL archive decks through the delete endpoint instead of physically deleting deck rows.

#### Scenario: User archives an owned active deck

- **WHEN** an authenticated user requests `DELETE /api/decks/[id]` for a non-archived deck they own
- **THEN** the system SHALL set the deck's `archived_at` value and respond with a successful JSON response

#### Scenario: Archived or unowned deck cannot be archived again

- **WHEN** an authenticated user requests `DELETE /api/decks/[id]` for an archived or unowned deck
- **THEN** the system SHALL respond with HTTP 404 and a JSON error response

### Requirement: Simple deck API error shape

The system SHALL return deck API errors as JSON objects with an `error` string.

#### Scenario: API error response shape

- **WHEN** a deck CRUD API operation fails due to authentication, validation, or missing resource conditions
- **THEN** the response body SHALL include an `error` string
