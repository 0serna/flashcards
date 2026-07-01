## ADDED Requirements

### Requirement: Passwordless email entry

The system SHALL provide a public login page where a user can request a Supabase Magic Link using only an email address.

#### Scenario: User requests a Magic Link

- **WHEN** a visitor submits a valid email address on `/login`
- **THEN** the system SHALL request a Supabase Magic Link for that email

#### Scenario: New email requests access

- **WHEN** a visitor submits an email address that does not belong to an existing user
- **THEN** the system SHALL allow Supabase Auth to create the user automatically

#### Scenario: Invalid email is submitted

- **WHEN** a visitor submits an invalid email address on `/login`
- **THEN** the system SHALL reject the request without calling Supabase Auth

### Requirement: Magic Link confirmation

The system SHALL provide a public confirmation endpoint that verifies Supabase Magic Link tokens and establishes the authenticated session.

#### Scenario: Valid Magic Link is opened

- **WHEN** Supabase redirects a user to `/auth/confirm` with a valid token hash and email OTP type
- **THEN** the system SHALL verify the token with Supabase and redirect the user to `/`

#### Scenario: Invalid Magic Link is opened

- **WHEN** Supabase redirects a user to `/auth/confirm` with a missing or invalid token
- **THEN** the system SHALL not authenticate the user and SHALL redirect them to `/login`

### Requirement: Protected application access

The system SHALL prevent unauthenticated access to protected application routes.

#### Scenario: Unauthenticated user opens the app root

- **WHEN** a visitor without a valid Supabase session requests `/`
- **THEN** the system SHALL redirect the visitor to `/login`

#### Scenario: Authenticated user opens the app root

- **WHEN** a user with a valid Supabase session requests `/`
- **THEN** the system SHALL render the protected app content

#### Scenario: Authenticated user opens login

- **WHEN** a user with a valid Supabase session requests `/login`
- **THEN** the system SHALL redirect the user to `/`

### Requirement: Public auth and asset routes

The system SHALL keep authentication routes and required static application assets accessible without an authenticated session.

#### Scenario: Visitor opens login

- **WHEN** a visitor requests `/login`
- **THEN** the system SHALL render the login page without requiring authentication

#### Scenario: Supabase opens confirmation route

- **WHEN** Supabase requests `/auth/confirm`
- **THEN** the system SHALL allow the request without requiring an existing authenticated session

#### Scenario: Browser requests app assets

- **WHEN** a browser requests framework assets, icon assets, or the web app manifest
- **THEN** the system SHALL serve those assets without redirecting to login
