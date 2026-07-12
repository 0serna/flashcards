## Context

Authenticated pages currently rely on Next.js history behavior for browser Back, while breadcrumbs and explicit exit actions use deterministic parent URLs. A module-level dirty-form `popstate` listener already restores the current entry before confirming navigation. The change must unify these mechanisms without affecting `/login`, server routes, or hard exits such as closing the browser.

## Goals / Non-Goals

**Goals:**

- Make every authenticated browser Back event resolve to the current route's immediate parent.
- Keep Home active when Back is requested and discard Forward history that could reopen descendants.
- Use the same parent definitions as breadcrumbs and explicit return actions.
- Compose history handling with dirty-form confirmation, navigation feedback, and pending mutations.
- Behave consistently after direct entry, refresh, and entry from an external site.

**Non-Goals:**

- Preventing the operating system from directly closing a tab or installed PWA.
- Changing normal browser history on `/login` or unauthenticated/error surfaces.
- Turning study-card UI state into route history.
- Changing application routes, persistence, or server APIs.

## Decisions

### Centralize authenticated history ownership

A single client-side navigation boundary in the authenticated `AppScreen` will own `popstate` handling. It will establish a same-route protected history entry so direct entries generate a controllable history event, stop Next.js from processing raw chronological destinations, and resolve Back through an explicit parent map. Handling this in each page was rejected because listener ordering, Home protection, and dirty-form behavior would diverge.

### Resolve parents from route patterns

A pure route resolver will map authenticated paths to immediate parents:

- `/` → `/`
- `/decks/new` and `/decks/archived` → `/`
- `/decks/:deckId` → `/`
- `/decks/:deckId/edit`, `/decks/:deckId/cards/new`, `/decks/:deckId/cards/:cardId/edit`, `/decks/:deckId/cards/archived`, and `/decks/:deckId/study` → `/decks/:deckId`

Query parameters do not create hierarchy levels. Review and Practice therefore share the Deck parent. Deriving parents from chronological provenance was rejected because direct entries do not have reliable app history.

### Normalize history after every intercepted traversal

On an intercepted Back event, the boundary will restore controlled history before routing with replacement semantics to the resolved parent. Restoring via a new controlled entry discards the browser Forward branch. At Home, the restored entry remains Home and no route transition occurs. State markers and a re-entrancy lock will distinguish boundary-owned normalization from user traversal and rapid repeated gestures.

A purely passive `popstate` listener was rejected because `popstate` is not cancelable and Next.js could render the chronological destination first. Leaving Forward intact was rejected because it could reopen a descendant after upward navigation.

### Make navigation guards composable

The boundary will consult shared navigation state before resolving a traversal:

1. If a mutation is pending, restore the current entry and ignore the request.
2. If a form is dirty, restore the current entry and request confirmation; cancellation remains on the current route, while acceptance clears the dirty state and navigates to the parent.
3. Otherwise, navigate immediately to the parent.

The existing dirty-form store will expose guard decisions to the boundary instead of owning an independent `popstate` listener. A shared pending-mutation signal will cover client-managed saves, archives/restores, and study ratings. Separate listeners were rejected because event ordering can cause duplicate prompts or competing history writes.

### Keep explicit navigation deterministic

Breadcrumbs, Cancel, Home, study exit, and post-mutation destinations continue to use explicit URLs and replacement semantics. Browser gesture handling does not call `router.back()`. Navigation loading feedback starts only when an actual parent transition begins, not when Home absorbs a gesture, a dirty-form confirmation is declined, or a mutation blocks navigation.

## Risks / Trade-offs

- [Browser history manipulation differs across mobile browsers] → Keep the mechanism based on standard `history`/`popstate`, test state transitions independently, and add browser-level coverage for direct entry, Back, and Forward where practical.
- [A direct external entry leaves an external page below the controlled entries] → Home continuously restores its controlled entry, intentionally enforcing the documented absolute boundary.
- [Rapid gestures can cause duplicate transitions] → Use a synchronous lock and idempotent route-state normalization.
- [A mutation signal can remain stuck after failure] → Wrap mutation registration in `try/finally` and test both success and rejection.
- [Route additions can omit a parent mapping] → Make unresolved authenticated nested routes fail safely at Home or the nearest recognized ancestor and require resolver tests for every page route.
- [Users may expect conventional browser history] → Keep explicit breadcrumbs visible and scope the behavior strictly to authenticated screens.
