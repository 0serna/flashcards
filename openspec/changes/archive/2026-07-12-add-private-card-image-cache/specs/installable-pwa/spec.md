## MODIFIED Requirements

### Requirement: No offline behavior in initial PWA shell

The system SHALL NOT introduce a Service Worker, Serwist integration, or custom caching behavior in the initial PWA shell. Private card image responses MAY use browser-private HTTP caching as defined by the private card image experience; that caching SHALL NOT add offline study behavior or a Service Worker.

#### Scenario: Initial implementation avoids caching complexity

- **WHEN** the initial PWA shell is implemented
- **THEN** it SHALL only provide installability metadata and icon assets without offline runtime behavior

#### Scenario: Private image response uses browser HTTP caching

- **WHEN** an authenticated application image route returns a private card image
- **THEN** it SHALL be permitted to use browser-private HTTP caching without adding offline runtime behavior to the PWA shell
