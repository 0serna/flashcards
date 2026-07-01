## ADDED Requirements

### Requirement: Login form uses shared UI controls

The system SHALL render the passwordless login form using the shared UI component foundation for its visible form controls without changing authentication behavior.

#### Scenario: Visitor opens login form

- **WHEN** a visitor requests `/login`
- **THEN** the system SHALL render the email label, email input, and submit button using shared UI components

#### Scenario: Visitor submits login form

- **WHEN** a visitor submits an email address on `/login`
- **THEN** the system SHALL preserve the existing email field name, validation behavior, Magic Link request behavior, and error display behavior
