## 1. Navigation Contract

- [x] 1.1 Read the repository-local Next.js 16 App Router navigation and history guidance before changing client navigation code
- [x] 1.2 Add failing unit tests for the authenticated route-to-parent resolver covering every current page route and query-string study modes
- [x] 1.3 Implement the pure route-to-parent resolver with Home as the safe terminal fallback

## 2. Hierarchical History Boundary

- [x] 2.1 Add failing tests for direct-entry Back, nested Back, Deck-to-Home Back, Home absorption, Forward neutralization, and rapid repeated history events
- [x] 2.2 Implement a single authenticated history boundary with controlled history-state markers, traversal locking, and replacement navigation
- [x] 2.3 Mount the boundary only in the authenticated app shell and integrate actual parent transitions with navigation loading feedback
- [x] 2.4 Verify `/login` and unauthenticated/error surfaces retain normal browser-history behavior

## 3. Navigation Guards

- [x] 3.1 Refactor dirty-form history tests to require confirmation through the centralized boundary while preserving `beforeunload` behavior
- [x] 3.2 Remove independent dirty-form `popstate` ownership and expose composable dirty-state confirmation to the history boundary
- [x] 3.3 Add a shared pending-mutation signal with tests proving Back is ignored during pending work and restored after success or failure
- [x] 3.4 Wire Deck/Card saves, archive/restore actions, and study-rating submissions into pending-mutation tracking with `try/finally` cleanup

## 4. Flow Verification

- [x] 4.1 Add integration tests proving browser Back exits every Review/Practice UI state directly to its owning Deck
- [x] 4.2 Add integration tests for dirty-form Back acceptance and rejection, including direct-entry forms
- [x] 4.3 Verify explicit breadcrumb, Cancel, Home, study-exit, and post-mutation navigation remains deterministic and does not create descendant Forward history
- [x] 4.4 Run the full test, lint, and production build quality gates and fix all reported issues
