## ADDED Requirements

### Requirement: Minimal Next.js application shell

The system SHALL provide a runnable Next.js App Router application initialized with TypeScript, Tailwind CSS, ESLint, npm, a `src/` directory, and the default `@/*` import alias.

#### Scenario: Project installs and runs

- **WHEN** dependencies are installed with npm and the development server is started
- **THEN** the application SHALL serve a Next.js App Router page without runtime errors

#### Scenario: Quality checks run

- **WHEN** the project lint command is executed
- **THEN** ESLint SHALL complete successfully

### Requirement: Initial flashcards landing page

The system SHALL show a minimal authenticated app page for the Flashcards app after the user has logged in.

#### Scenario: Authenticated user opens the root page

- **WHEN** an authenticated user visits `/`
- **THEN** the page SHALL display a minimal “Hola mundo” message for the Flashcards app
