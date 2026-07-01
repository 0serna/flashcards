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
The system SHALL show a minimal landing page for the Flashcards app instead of the default Next.js starter content.

#### Scenario: User opens the root page
- **WHEN** a user visits `/`
- **THEN** the page SHALL display a minimal hello-world message for the Flashcards app
