## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Unsaved form changes are protected

The system SHALL warn before leaving a dirty Deck or Card form through internal navigation, upward browser navigation, or hard browser exit.

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
