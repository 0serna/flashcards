## Purpose

Provide a minimal Next.js App Router application shell with TypeScript, Tailwind CSS, and a landing page for the Flashcards app.

## Requirements

### Requirement: Minimal Next.js application shell

The system SHALL provide a runnable Next.js App Router application initialized with TypeScript, Tailwind CSS, ESLint, npm, a `src/` directory, and the default `@/*` import alias.

#### Scenario: Project installs and runs

- **WHEN** dependencies are installed with npm and the development server is started
- **THEN** the application SHALL serve a Next.js App Router page without runtime errors

#### Scenario: Quality checks run

- **WHEN** the project lint command is executed
- **THEN** ESLint SHALL complete successfully

### Requirement: Initial cards landing page

The system SHALL show an authenticated Home page for the Flashcards app with the shared authenticated header, the user's active Decks, and available Deck actions after the user has logged in.

#### Scenario: Authenticated user opens the root page

- **WHEN** an authenticated user visits `/`
- **THEN** the page SHALL display the shared Flashcards header with a link to Home and the existing account menu, followed by the user's active Decks and available Home actions

#### Scenario: Unauthenticated user opens the root page

- **WHEN** an unauthenticated user visits `/`
- **THEN** the application SHALL redirect the user to `/login` without rendering the authenticated header

### Requirement: Shared authenticated application header

The system SHALL render one consistent global header on every authenticated view under the current application routes.

#### Scenario: Authenticated view renders the global header

- **WHEN** an authenticated user opens Home, an archived-Deck view, a Deck view, a Card view, a form, or a Review/Practice view
- **THEN** the view SHALL render the Flashcards logo linking to `/` and the existing account menu in the same header structure

#### Scenario: Header remains outside unauthenticated surfaces

- **WHEN** a user opens the login page or an application-level error surface
- **THEN** the page SHALL NOT require the authenticated header or account menu

#### Scenario: Header does not create a primary navigation layer

- **WHEN** an authenticated view renders the global header
- **THEN** the header SHALL contain no additional primary navigation destinations beyond the existing Home logo link and account menu

### Requirement: Failed screens provide independent recovery

The system SHALL provide recovery actions when a route-level or global rendering error prevents a screen from operating normally.

#### Scenario: User retries a failed screen

- **WHEN** a route-level or global error surface is displayed
- **THEN** the surface SHALL let the user retry rendering the failed screen

#### Scenario: User exits a persistent failure

- **WHEN** retrying does not recover the failed screen
- **THEN** the surface SHALL provide a document-level POST action that ends the local session and redirects to `/login` without depending on Home or client-side navigation

#### Scenario: Error can be correlated with production logs

- **WHEN** the rendering error includes an error reference
- **THEN** the surface SHALL display the reference in a selectable form

### Requirement: Contextual navigation identifies the current view

The system SHALL render semantic contextual navigation for every nested authenticated view, showing deterministic parent destinations and the current view as the current location.

#### Scenario: Nested view shows its route hierarchy

- **WHEN** an authenticated user opens a nested view such as Deck detail, Card editing, archived Cards, or Review
- **THEN** the view SHALL show a breadcrumb with clickable ancestor links, a non-clickable current item, and `aria-current="page"` on the current item

#### Scenario: Deck context uses the Deck name

- **WHEN** a nested view belongs to a Deck
- **THEN** the breadcrumb SHALL use the Deck name directly as the Deck segment and SHALL NOT require a redundant generic `Deck` segment

#### Scenario: Breadcrumb shows the full path on every viewport

- **WHEN** a nested view is rendered at any viewport
- **THEN** the breadcrumb SHALL show the full available path beginning with `Home`, followed by any Deck context, and ending with the current item

#### Scenario: Home remains the root destination

- **WHEN** a breadcrumb includes the root application destination
- **THEN** its label SHALL be `Home` and its link SHALL target `/`

### Requirement: Navigation uses deterministic parent destinations

The system SHALL provide explicit parent links for authenticated views instead of relying on browser history as the primary back behavior.

#### Scenario: Direct entry has a usable parent destination

- **WHEN** a user opens an authenticated nested URL directly, from a refresh, or in a new tab
- **THEN** the contextual navigation SHALL still provide the correct parent destination for that route

#### Scenario: Study session can end explicitly

- **WHEN** a user is in an active Review or Practice session
- **THEN** the contextual navigation SHALL provide `End session` linking directly to the owning Deck

#### Scenario: Study completion keeps a meaningful return action

- **WHEN** a Review or Practice session has no available Cards or has reached its completion state
- **THEN** the page SHALL provide a `Back to [Deck name]` action linking to the owning Deck

### Requirement: Unsaved form changes are protected

The system SHALL warn before leaving a dirty Deck or Card form through internal navigation or browser-level navigation.

#### Scenario: Dirty form uses an internal navigation path

- **WHEN** a user changes a Deck or Card form and activates the logo, breadcrumb, parent link, or Cancel link
- **THEN** the application SHALL request confirmation before discarding the unsaved changes

#### Scenario: Dirty form uses browser Back

- **WHEN** a user changes a Deck or Card form and invokes browser Back
- **THEN** the application SHALL remain on the current route while requesting confirmation to discard the changes
- **AND** accepting SHALL navigate to the deterministic immediate parent
- **AND** declining SHALL keep the dirty form active

#### Scenario: Dirty form uses a hard browser exit

- **WHEN** a user changes a Deck or Card form and refreshes, closes, or otherwise unloads the page
- **THEN** the application SHALL use the browser's unload warning mechanism before discarding the unsaved changes

#### Scenario: Clean form leaves without a warning

- **WHEN** a Deck or Card form has no unsaved changes and the user navigates away
- **THEN** the application SHALL navigate to the deterministic destination without showing an unsaved-change warning

#### Scenario: Successful form submission clears the guard

- **WHEN** a Deck or Card form submits successfully
- **THEN** subsequent navigation SHALL not be treated as leaving unsaved changes from that submission

### Requirement: Authenticated navigation uses repository terminology

The system SHALL use the existing English navigation copy and the canonical `Card`/`cards` terminology in user-facing contextual navigation.

#### Scenario: Card navigation labels are consistent

- **WHEN** a user opens Card creation, Card editing, or archived Cards
- **THEN** the contextual navigation and related navigation actions SHALL use `card` or `cards` rather than `flashcard` or `flashcards`

### Requirement: Authenticated browser navigation follows the app hierarchy

The system SHALL interpret browser Back on authenticated screens as upward navigation to the immediate parent defined by the contextual navigation hierarchy, regardless of chronological browser history.

#### Scenario: Nested screen ascends to its immediate parent

- **WHEN** an authenticated user invokes browser Back from a nested screen
- **THEN** the application SHALL replace the current screen with that screen's immediate breadcrumb parent

#### Scenario: Direct entry ascends through unvisited parents

- **WHEN** an authenticated user opens a nested URL directly and invokes browser Back
- **THEN** the application SHALL navigate to the deterministic immediate parent even when that parent has no prior browser-history entry

#### Scenario: Deck screen ascends to Home

- **WHEN** an authenticated user invokes browser Back from a Deck screen
- **THEN** the application SHALL navigate to Home at `/`

#### Scenario: Home absorbs browser Back

- **WHEN** an authenticated user invokes browser Back from Home
- **THEN** the application SHALL remain on Home even when the preceding chronological entry is external to the app

#### Scenario: Browser Forward cannot reopen a descendant

- **WHEN** upward navigation or Home protection has handled browser Back and the user invokes browser Forward
- **THEN** the application SHALL NOT restore a descendant or external chronological entry

#### Scenario: Study session ascends directly to its Deck

- **WHEN** an authenticated user invokes browser Back from any active, empty, ended, or completed Review or Practice state
- **THEN** the application SHALL navigate directly to the owning Deck without traversing Card faces, answered Cards, or summary states

#### Scenario: Unauthenticated navigation remains chronological

- **WHEN** a user invokes browser Back or Forward on `/login` or another unauthenticated surface
- **THEN** the application SHALL leave browser-history behavior unchanged

### Requirement: Pending mutations block upward navigation

The system SHALL ignore browser Back while an authenticated save, archive, restore, or study-rating mutation is pending.

#### Scenario: Back is invoked during a mutation

- **WHEN** an authenticated user invokes browser Back while a guarded mutation is pending
- **THEN** the application SHALL remain on the current screen without starting an upward route transition

#### Scenario: Mutation settles

- **WHEN** the pending mutation succeeds or fails
- **THEN** the application SHALL restore the normal upward-navigation behavior for a subsequent browser Back request
