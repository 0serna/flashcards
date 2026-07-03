## ADDED Requirements

### Requirement: Web app manifest

The system SHALL expose a web app manifest for the Flashcards app with the minimum metadata needed for mobile installation.

#### Scenario: Browser reads manifest metadata

- **WHEN** a browser requests the app manifest
- **THEN** the manifest SHALL include `name` as `Flashcards`, `short_name` as `Flashcards`, `start_url`, `display` set to `standalone`, and theme/background colors

### Requirement: PWA icon assets

The system SHALL provide placeholder PWA icon assets in the public app assets.

#### Scenario: Browser validates install icons

- **WHEN** a browser evaluates the manifest icons
- **THEN** the manifest SHALL reference available PNG icons sized 192x192 and 512x512

### Requirement: No offline behavior in initial PWA shell

The system SHALL NOT introduce a Service Worker, Serwist integration, or custom caching behavior in the initial PWA shell.

#### Scenario: Initial implementation avoids caching complexity

- **WHEN** the initial PWA shell is implemented
- **THEN** it SHALL only provide installability metadata and icon assets without offline runtime behavior
