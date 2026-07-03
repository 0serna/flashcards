## MODIFIED Requirements

### Requirement: Card storage with text and image references

The system SHALL persist flashcards inside decks with front and back content that can contain text, an image path, or both, and with explicit spaced-repetition scheduling state.

#### Scenario: Card table supports front and back content

- **WHEN** the database schema is applied
- **THEN** the system SHALL provide a `cards` table with a deck reference, nullable front text, nullable front image path, nullable back text, nullable back image path, current due timestamp, current ease factor, current review count, current interval in minutes, creation/update timestamps, and optional archive timestamp

#### Scenario: Card front requires content

- **WHEN** a card row is inserted or updated
- **THEN** the database SHALL reject the row unless the front has either text content or an image path

#### Scenario: Card back requires content

- **WHEN** a card row is inserted or updated
- **THEN** the database SHALL reject the row unless the back has either text content or an image path

#### Scenario: Card access follows deck ownership

- **WHEN** row-level security is evaluated for card rows
- **THEN** authenticated users SHALL only be allowed to access cards whose parent deck is owned by their own Supabase Auth user id
