## 1. Shared authenticated shell

- [x] 1.1 Extract the Home header into a reusable authenticated header component that renders the existing `Logo` link and `AccountMenu` with `signOutAction` unchanged.
- [x] 1.2 Update `AppScreen` to render the shared authenticated header at the top of every screen while preserving its current width, spacing, and non-sticky behavior.
- [x] 1.3 Add a typed contextual-navigation model and reusable breadcrumb component with semantic `nav`/list markup, clickable ancestors, `aria-current="page"`, and accessible labels.
- [x] 1.4 Implement responsive breadcrumb presentation: compact immediate-parent/current navigation on mobile and the full `Home / Deck / current` path on wider screens, including safe visual truncation for long Deck names.
- [x] 1.5 Add the shared guarded-navigation mechanism needed to confirm dirty-form exits for internal links and support browser `beforeunload`/history navigation protection.

## 2. Integrate authenticated routes

- [x] 2.1 Remove the Home-only header and add the Home screen's contextual-navigation behavior without introducing a redundant breadcrumb on the root page.
- [x] 2.2 Add deterministic contextual navigation to archived Decks and Deck detail with `Home` and the correct Deck parent/current labels.
- [x] 2.3 Add deterministic contextual navigation to Deck creation/editing, Card creation/editing, and archived Cards, keeping each form's parent destination aligned with its existing Cancel target.
- [x] 2.4 Update Review and Practice views to use the shared header and contextual navigation, keep `End session` linked to the owning Deck, and retain `Back to [Deck name]` only for empty/completed states.
- [x] 2.5 Integrate dirty-state tracking and guarded exits into Deck and Card forms, clearing the guard after successful submission and preserving existing form actions.
- [x] 2.6 Remove obsolete one-off Home/Deck parent links and duplicate page-level header structures without changing route URLs or data behavior.
- [x] 2.7 Verify all affected user-facing navigation labels use the repository's `card/cards` terminology and preserve the existing English copy.

## 3. Tests

- [x] 3.1 Add component tests for the shared header and contextual navigation, covering Home links, account-menu presence, current-item semantics, parent destinations, and long Deck names.
- [x] 3.2 Update authenticated page/flow tests to verify the shared header and deterministic navigation across archived Decks, Deck detail, forms, archived Cards, and Review/Practice.
- [x] 3.3 Add form navigation tests covering clean exits, dirty internal exits, successful-submit guard clearing, and browser-level guard registration behavior.
- [x] 3.4 Run `npm run test`, `npm run check`, and `npm run build`; resolve any regressions without suppressing quality warnings.
