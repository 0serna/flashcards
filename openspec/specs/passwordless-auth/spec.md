## Purpose

Define how users authenticate into the Flashcards app using Google OAuth as the sole sign-in method, replacing Magic Link passwordless email auth.

## Requirements

### Requirement: Passwordless email entry

The system SHALL provide a public login page where a visitor can start Supabase Google OAuth as the only supported sign-in method.

#### Scenario: User starts Google sign-in

- **WHEN** a visitor activates the Google sign-in control on `/login`
- **THEN** the system SHALL start Supabase OAuth with the Google provider

#### Scenario: New Google account requests access

- **WHEN** a visitor signs in with a Google account that does not belong to an existing Supabase user
- **THEN** the system SHALL allow Supabase Auth to create the user automatically

#### Scenario: Email Magic Link is not offered

- **WHEN** a visitor opens `/login`
- **THEN** the system SHALL not offer an email Magic Link request form

### Requirement: Magic Link confirmation

The system SHALL provide a public OAuth callback endpoint that exchanges Supabase auth codes for an authenticated session.

#### Scenario: Valid Google OAuth callback is opened

- **WHEN** Supabase redirects a user to `/auth/callback` with a valid auth code after Google sign-in
- **THEN** the system SHALL exchange the code with Supabase and redirect the user to `/`

#### Scenario: Invalid Google OAuth callback is opened

- **WHEN** `/auth/callback` is requested with a missing or invalid auth code
- **THEN** the system SHALL not authenticate the user and SHALL redirect them to `/login`

### Requirement: Public auth and asset routes

The system SHALL keep authentication routes and required static application assets accessible without an authenticated session.

#### Scenario: Visitor opens login

- **WHEN** a visitor requests `/login`
- **THEN** the system SHALL render the login page without requiring authentication

#### Scenario: Supabase opens OAuth callback route

- **WHEN** Supabase requests `/auth/callback`
- **THEN** the system SHALL allow the request without requiring an existing authenticated session

#### Scenario: Browser requests app assets

- **WHEN** a browser requests framework assets, icon assets, or the web app manifest
- **THEN** the system SHALL serve those assets without redirecting to login

#### Scenario: Failed screen requests session recovery

- **WHEN** a browser submits `POST /auth/recover`
- **THEN** the system SHALL process the request without requiring an operable authenticated screen

### Requirement: Sign-out ends the local session

The system SHALL end only the current browser session when a user signs out normally or exits a failed screen through session recovery.

#### Scenario: Authenticated user signs out normally

- **WHEN** an authenticated user activates Sign-out
- **THEN** the system SHALL end the session on the current browser without signing the user out on other devices and SHALL redirect to `/login`

#### Scenario: Authentication service is unavailable during recovery

- **WHEN** failed-screen recovery cannot complete sign-out through Supabase Auth
- **THEN** the system SHALL still clear the local Supabase authentication cookies and redirect to `/login`

### Requirement: Login form uses shared UI controls

The system SHALL render the passwordless login interface using the shared UI component foundation for its visible controls without changing authentication behavior.

#### Scenario: Visitor opens login form

- **WHEN** a visitor requests `/login`
- **THEN** the system SHALL render the Google sign-in control using shared UI components

#### Scenario: Visitor submits login form

- **WHEN** a visitor activates Google sign-in on `/login`
- **THEN** the system SHALL preserve Google OAuth request behavior and error display behavior
