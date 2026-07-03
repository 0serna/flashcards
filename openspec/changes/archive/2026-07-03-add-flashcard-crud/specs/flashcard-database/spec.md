## ADDED Requirements

### Requirement: Private flashcard image storage

The system SHALL store flashcard images in private Supabase Storage and persist storage object paths on flashcard rows.

#### Scenario: Private image bucket is available

- **WHEN** the storage configuration is applied
- **THEN** the system SHALL provide a private bucket for flashcard images that accepts JPEG, PNG, and WebP files up to 5 MB

#### Scenario: Image access follows study material ownership

- **WHEN** authenticated users access flashcard image objects through the app
- **THEN** the system SHALL only provide signed image URLs for images referenced by flashcards in decks owned by the current user

#### Scenario: Card rows keep image paths

- **WHEN** a flashcard image is uploaded for a front or back side
- **THEN** the corresponding card row SHALL store the private storage object path instead of a public URL
