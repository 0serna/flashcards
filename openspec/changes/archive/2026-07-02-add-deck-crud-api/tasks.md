## 1. Validation and Database Access

- [x] 1.1 Add deck request validation schemas for create and update payloads.
- [x] 1.2 Add a runtime Drizzle database client for server-side route handler use.
- [x] 1.3 Add a shared helper for authenticated user lookup and simple JSON API errors.

## 2. Collection Endpoint

- [x] 2.1 Add tests for unauthenticated `GET /api/decks` and `POST /api/decks` requests.
- [x] 2.2 Add tests for listing only active decks owned by the authenticated user.
- [x] 2.3 Add tests for valid and invalid deck creation payloads.
- [x] 2.4 Implement `GET /api/decks` and `POST /api/decks` route handlers.

## 3. Single Deck Endpoint

- [x] 3.1 Add tests for unauthenticated `GET`, `PATCH`, and `DELETE` requests on `/api/decks/[id]`.
- [x] 3.2 Add tests for retrieving an owned active deck and hiding missing, archived, or unowned decks.
- [x] 3.3 Add tests for updating an owned active deck, rejecting invalid payloads, and hiding archived or unowned decks.
- [x] 3.4 Add tests for archiving an owned active deck and returning 404 for archived or unowned decks.
- [x] 3.5 Implement `GET`, `PATCH`, and `DELETE` route handlers for `/api/decks/[id]`.

## 4. Quality Gates

- [x] 4.1 Run the route handler tests and fix any failures.
- [x] 4.2 Run the repository check suite and fix any failures.
