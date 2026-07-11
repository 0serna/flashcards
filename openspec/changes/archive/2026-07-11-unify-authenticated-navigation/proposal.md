## Why

Authenticated views currently use inconsistent headers and ad hoc parent links, making it unclear where the user is and how to return to the relevant Deck or Home screen. A shared authenticated shell with explicit contextual navigation will make the app easier to orient across deck management, card management, and study sessions without adding a competing primary navigation layer.

## What Changes

- Share the Home header—Flashcards logo linking to Home and the existing account menu—across every authenticated view.
- Add contextual breadcrumb navigation to authenticated views, with deterministic parent destinations and the current view represented as non-clickable text.
- Use a compact mobile breadcrumb with a visible parent/back affordance and a fuller breadcrumb on wider screens.
- Cover Home, archived decks, Deck detail, Review, Practice, Deck forms, Card forms, and archived Cards.
- Preserve explicit study-session exits and completion CTAs while avoiding duplicate back controls during active study.
- Protect all form exits from losing unsaved changes, including contextual links, Home, browser back, refresh, and page close.
- Keep existing English navigation copy and align the domain glossary to use `Card`/`Archived card` terminology.
- Add navigation-focused component and flow coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: Extend the application shell to provide a consistent authenticated header and contextual navigation across all authenticated views, including deterministic back destinations and unsaved-form protection.

## Impact

- Affected shared UI: `AppScreen`, the Home header, account menu integration, and new contextual navigation components.
- Affected authenticated routes under `src/app/`, including deck, Card, archive, form, and study pages.
- Affected client-side form navigation behavior for unsaved changes.
- Affected tests covering page rendering and deck/Card navigation flows.
- `CONTEXT.md` glossary terminology is updated from Flashcard to Card without changing the product name.
