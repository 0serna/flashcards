## MODIFIED Requirements

### Requirement: Pending mutations block upward navigation

The system SHALL ignore browser Back and form exit actions while an authenticated mutation is pending, then restore navigation after the mutation settles or becomes unconfirmed.

#### Scenario: Back is invoked during a mutation

- **WHEN** an authenticated user invokes browser Back while a guarded mutation is pending
- **THEN** the application SHALL remain on the current screen without starting an upward route transition

#### Scenario: Internal form exit is invoked during a mutation

- **WHEN** an authenticated user activates Cancel, a breadcrumb, the Home logo, or another parent destination while its form mutation is pending
- **THEN** the application SHALL remain on the current screen without starting navigation

#### Scenario: Mutation settles

- **WHEN** the pending mutation succeeds or is definitively rejected
- **THEN** the application SHALL restore the normal upward-navigation and form-exit behavior for a subsequent request

#### Scenario: Mutation becomes unconfirmed

- **WHEN** the client has not received a mutation result after 15 seconds
- **THEN** the application SHALL restore normal navigation and form-exit behavior while preserving the mutation identity for safe retry
