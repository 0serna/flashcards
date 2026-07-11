## Context

The authenticated routes currently all render through `AppScreen`, but the Home page is the only route that renders the shared-looking `Logo` and `AccountMenu` header. Nested routes instead render one-off links such as `Home` or the Deck name, and study sessions use a separate header. The app is mobile-first, uses server-rendered App Router pages with client components for menus and forms, and has no persistent primary navigation pattern.

The change must preserve the existing product language and visual direction: calm, compact, accessible navigation in English, with `Card`/`cards` as the domain term. Login and global error surfaces remain outside the authenticated shell.

## Goals / Non-Goals

**Goals:**

- Centralize the authenticated header so every current authenticated route has the same Flashcards/Home link and account menu.
- Give every nested authenticated view an explicit, deterministic parent destination and a visible current location.
- Provide a responsive breadcrumb presentation that is compact on mobile and complete on wider screens.
- Keep study-session exit behavior explicit and keep form navigation safe when edits are unsaved.
- Preserve existing route URLs, page actions, account-menu behavior, and English UI copy.
- Make the navigation contract reusable and testable.

**Non-Goals:**

- Adding a primary navigation bar, new product destinations, or a new account-menu design.
- Applying the authenticated header to login, global errors, or other unauthenticated surfaces.
- Changing Deck, Card, Review, Practice, or study-session data behavior.
- Introducing a new routing hierarchy or changing public URLs.
- Rewriting all existing copy beyond navigation labels required for consistency.

## Decisions

### 1. Make `AppScreen` the authenticated shell boundary

All current authenticated pages already use `AppScreen`, while login and error pages do not. `AppScreen` will render the shared global header before its page content, removing the Home-only header and avoiding route moves or URL changes.

The global header will contain the existing `Logo` linked to `/` and the unchanged `AccountMenu` using `signOutAction`. It will be rendered at the top of each screen, will not be sticky, and will not introduce a second primary navigation layer.

**Alternative considered:** Add a new route-group layout around authenticated routes. This would establish a clean boundary, but it would require moving route files and deciding how errors/not-found states inherit the layout. Reusing the existing shell boundary is lower risk for the current route set.

### 2. Use a data-driven contextual navigation component

Pages will provide a small ordered model of navigation items: `Home`, optional Deck name, and the current view. A shared component will render this model as semantic breadcrumb navigation. Ancestors will be links, the current item will be non-clickable text with `aria-current="page"`, and the immediate parent link will carry the visible left-arrow/back affordance and parent label.

On narrow screens, CSS will show the immediate parent and current item in a single compact row. On wider screens, the complete `Home / Deck / current` path will be visible. Long dynamic Deck names will truncate visually without changing their accessible name.

**Alternative considered:** Call `router.back()` from a generic Back button. That fails for direct URL entry, refreshes, and new-tab entry because browser history may not contain the intended parent. Deterministic links are stable and testable.

### 3. Define navigation destinations per route, not from browser history

The route mapping will be explicit:

- Home: no contextual breadcrumb.
- Archived decks: `Home / Archived decks`.
- Deck detail: `Home / [Deck name]`.
- Study: `Home / [Deck name] / Review` or `Practice`, with `End session` targeting the Deck.
- Deck creation: `Home / Create deck`.
- Deck editing: `Home / [Deck name] / Edit deck`.
- Card creation: `Home / [Deck name] / Add card`.
- Card editing: `Home / [Deck name] / Edit card`.
- Archived cards: `Home / [Deck name] / Archived cards`.

The existing completion/empty-state `Back to [Deck name]` CTA remains only where it communicates a meaningful study outcome. Active study uses the contextual `End session` action rather than a duplicate inline back link.

### 4. Guard unsaved form exits at the shell level

Forms will expose dirty state to a reusable client-side navigation guard. Internal shell links and form cancellation will use the same parent destination and ask for confirmation only while the form is dirty. The guard will clear on successful submission.

The browser-level `beforeunload` event will protect refresh, close, and full-document navigation. Client-side history navigation will be handled by the guard's history/popstate integration so browser Back is also covered. The confirmation copy will remain concise and use the native browser confirmation mechanism where required; no new visual dialog system is introduced by this change.

**Alternative considered:** Protect only the visible Cancel link. That leaves the global logo, breadcrumb, browser Back, and refresh as data-loss paths, contradicting the navigation contract.

### 5. Keep domain terminology aligned with the repository glossary

User-facing navigation will retain the existing English labels and use `card/cards` rather than introducing `flashcard` terminology. `CONTEXT.md` has been updated so `Card` and `Archived card` are canonical terms while `Flashcards` remains the product name.

## Risks / Trade-offs

- **[Risk]** A shared shell change can affect vertical spacing on every authenticated screen. → **Mitigation:** keep the header compact, preserve the existing `AppScreen` max width, and add route-level rendering tests.
- **[Risk]** Responsive breadcrumb truncation can hide useful Deck context. → **Mitigation:** preserve the full accessible label, keep the current page visible, and verify long Deck names in component tests.
- **[Risk]** Browser Back interception with App Router history can be timing-sensitive. → **Mitigation:** isolate it in one client guard, test cancel/confirm flows, and manually verify Back, refresh, and close behavior in a browser.
- **[Risk]** Server-rendered pages and client-side dirty-state tracking have different lifecycles. → **Mitigation:** keep route destinations server-defined and limit client state to form dirtiness and navigation interception.
- **[Risk]** Existing links may bypass the new guard if they are not shared navigation primitives. → **Mitigation:** use one guarded link/context mechanism for shell navigation and update form cancellation links to use it.

## Migration Plan

1. Add shared authenticated header and contextual-navigation primitives without changing route URLs.
2. Move the Home header into the shared shell and remove page-level duplicate headers/parent links.
3. Add route-specific breadcrumb models and study/form guard integration.
4. Update and add component/flow tests, then run the full repository quality suite.
5. Rollback is a source revert: restore the previous `AppScreen` and page-level headers/links; no database or deployment migration is required.

## Open Questions

None. The navigation scope, route destinations, copy language, study behavior, and unsaved-change policy were resolved during design review.
