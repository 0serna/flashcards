## ADDED Requirements

### Requirement: Production releases have a discoverable identity

The system SHALL assign every production deployment a unique opaque release identity and expose the active identity through a public endpoint that does not require or refresh a user session.

#### Scenario: Production deployment is built

- **WHEN** the production deployment workflow builds an application artifact
- **THEN** the artifact SHALL contain an opaque identity unique to that deployment

#### Scenario: Client requests the active release

- **WHEN** any client requests the release identity endpoint
- **THEN** the endpoint SHALL return only the active deployment identity without requiring authentication
- **AND** the response SHALL prevent browser and intermediary caching

#### Scenario: Release identity is unavailable

- **WHEN** the application runs without production release metadata
- **THEN** release comparison SHALL remain disabled without reporting a false update

### Requirement: Authenticated clients detect active release changes

The system SHALL compare the release loaded by an authenticated client with the active production release when the client starts and when it returns to the foreground.

#### Scenario: Active release differs from loaded release

- **WHEN** a successful check returns an identity different from the loaded identity
- **THEN** the client SHALL enter the App update available state regardless of whether the active release is a forward deployment or rollback

#### Scenario: Active release matches loaded release

- **WHEN** a successful check returns the loaded identity
- **THEN** the client SHALL NOT report an App update as available

#### Scenario: Client remains continuously visible

- **WHEN** the authenticated client remains visible without regaining focus or returning from a hidden state
- **THEN** the system SHALL NOT perform periodic release checks

#### Scenario: Automatic release check fails

- **WHEN** a release check fails because of a network, response, or parsing error
- **THEN** the authenticated interface SHALL remain unchanged without displaying an error
- **AND** a later foreground event SHALL be allowed to retry the check

### Requirement: The authenticated header offers a restrained update action

The system SHALL show a compact, persistent `Update` action beside the Flashcards logo while an App update is available.

#### Scenario: Update becomes available on an authenticated view

- **WHEN** an authenticated view detects a different active release
- **THEN** its shared header SHALL show a touch-accessible secondary button labeled `Update` beside the Flashcards logo
- **AND** the interface SHALL announce the available update accessibly

#### Scenario: User continues without updating

- **WHEN** the `Update` action is visible and the user continues using the current release
- **THEN** the action SHALL remain available without blocking the current interface

#### Scenario: Unauthenticated or global error surface renders

- **WHEN** the login page or a global error surface is displayed
- **THEN** the surface SHALL NOT render the authenticated release update action

#### Scenario: Update details are presented

- **WHEN** the authenticated header reports an available update
- **THEN** it SHALL NOT expose a version number, commit hash, deployment identity, or release details

### Requirement: Users explicitly reload the current app context

The system SHALL update an eligible client only after the user activates `Update`, by performing a document reload of the current browsing context and URL.

#### Scenario: User updates with no protected work

- **WHEN** the user activates `Update` while no mutation is pending and no dirty-form warning is declined
- **THEN** the current window SHALL attempt a document reload of its current path, query, and fragment
- **AND** other windows or tabs SHALL remain unchanged

#### Scenario: User updates during a Study session

- **WHEN** the user activates `Update` during an active Review or Practice session with no mutation pending
- **THEN** the current window SHALL attempt the reload without an additional Study-session confirmation

#### Scenario: User updates while offline

- **WHEN** the user activates `Update` after connectivity has been lost
- **THEN** the current window SHALL still attempt the document reload without a connectivity preflight

#### Scenario: Dirty form reload is declined

- **WHEN** the browser's existing unsaved-change warning is shown for an update reload and the user declines to discard changes
- **THEN** the current document SHALL remain loaded
- **AND** the `Update` action SHALL remain available

### Requirement: App updates do not interrupt pending mutations

The system SHALL wait up to 15 seconds for pending authenticated mutations before attempting an App update reload.

#### Scenario: Pending mutation settles within the wait

- **WHEN** the user activates `Update` while a mutation is pending and the mutation settles within 15 seconds
- **THEN** the current window SHALL attempt the document reload after the mutation settles

#### Scenario: Pending mutation exceeds the wait

- **WHEN** the user activates `Update` while a mutation remains pending for 15 seconds
- **THEN** that update attempt SHALL end without reloading
- **AND** the persistent `Update` action SHALL become available again

### Requirement: Release detection adds no offline runtime

The release update notice SHALL operate without a Service Worker, application-managed offline cache, Web Push, background sync, or background release polling.

#### Scenario: Release notice capability is installed

- **WHEN** the release update notice is implemented
- **THEN** the application SHALL retain its existing online-only PWA behavior and SHALL register no Service Worker
