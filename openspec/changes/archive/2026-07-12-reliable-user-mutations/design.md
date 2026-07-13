## Context

Card and Deck create actions currently insert data and then call `redirect()`. Their client forms catch all thrown values to render inline errors, so Next.js redirect control flow can be mistaken for failure after the insert has committed. Retrying creates a new server-generated UUID and therefore a duplicate. Other forms rely on React state to disable controls, leaving a pre-render window for rapid repeated activation, while archive/restore forms have no local pending disablement.

The existing `decks`, `cards`, and `card_reviews` tables already have UUID primary keys. Review scheduling and history insertion already share a database transaction. Card image storage is external to that transaction and has explicit cleanup behavior.

## Goals / Non-Goals

**Goals:**

- Make repeated attempts for one persistent user intention converge on one domain outcome.
- Prevent rapid repeated submission before React pending state renders.
- Distinguish confirmed, rejected, and unconfirmed outcomes.
- Keep domain mutation actions independent from framework navigation control flow.
- Detect stale edits and Review answers.
- Preserve ownership checks and prevent orphaned image uploads.

**Non-Goals:**

- Rejecting distinct Cards solely because their content matches.
- Providing exactly-once physical execution across the browser, Postgres, and object storage.
- Persisting mutation intentions across a closed or reset form.
- Adding offline mutation queues or background synchronization.
- Changing authentication redirects or access guards into domain mutation outcomes.

## Decisions

### Domain actions return explicit outcomes and clients own continuation

Domain Server Actions will return a serializable discriminated result such as `confirmed`, `rejected`, or a successful resource identifier. Expected validation, ownership, not-found, and stale-version failures become explicit rejected outcomes. Unexpected transport/runtime failures remain exceptional; the client classifies an absent response as unconfirmed. Redirects remain outside domain actions, and the client performs `router.replace` or the appropriate continuation only after confirmation.

This is preferred over selectively rethrowing `NEXT_REDIRECT`: it removes framework exceptions from application error handling and supports the same feedback contract across all domain mutations.

### New record identity is assigned before submission

Create Deck, Create Card, and record Review interactions generate a UUID when their intention begins and submit it on every retry. Services insert that UUID rather than generating a fresh one. If that owned record already exists, the action returns its first confirmed result without changing it; an identifier collision outside the user's ownership is rejected without revealing another user's data.

The existing primary keys provide the uniqueness boundary, so no generic idempotency ledger or content uniqueness rule is required. `Save` and `Save and add another` submit the same Card UUID; only the confirmed-result continuation differs. A successful `Save and add another` resets the form and generates the next UUID.

### Repeated state transitions converge

Archive and Restore target a state and return the resulting state even if a retry finds it already reached. Card image creation checks for an existing owned Card before uploading where possible; concurrent losing attempts clean up only their own versioned paths. Update retries must not leave superseded storage objects behind.

### Writes carry an expected version

Deck and Card edits submit the source `updatedAt` value. The database update predicates include that value; no matching row produces a stale rejected outcome rather than last-write-wins overwrite. Review submission carries the scheduling version shown to the user, using `reviewCount` as the expected version. The transaction checks it before updating scheduling and inserting the preassigned Review UUID. A duplicate Review UUID returns its original outcome; a distinct Review against an advanced version is stale.

### Submission locking is synchronous and scoped to one interaction

A shared client-side form guard acquires an imperative/ref lock in the submit path before asynchronous work or React rendering. While held, every submitter and exit action belonging to that form is unavailable, the form exposes an accessible busy state, and authenticated upward navigation remains blocked through the existing pending-mutation store. Independent forms on a list retain independent locks.

All forms, including authentication and recovery forms, use the interaction lock. Domain idempotency applies only to persistent domain mutations.

### Unconfirmed timeout permits safe retry

After 15 seconds without a response, the client presents an unconfirmed outcome, releases the interaction lock, and permits retry with the same identity. The timeout does not claim to cancel the original server request. Any later or retried response converges through stable identity/version semantics. Definite rejection also releases the lock while preserving form input and the same intention for correction.

## Risks / Trade-offs

- [A 15-second threshold can expire during a slow image upload] → Label the result unconfirmed rather than failed and retain the same Card UUID for safe retry.
- [Client-assigned UUIDs are untrusted input] → Validate UUID shape and enforce existing ownership checks; never return another user's colliding record.
- [Two requests can upload image versions concurrently before one Card insert wins] → Use versioned paths and transaction-aware loser cleanup; test orphan cleanup explicitly.
- [A late response can arrive after the UI permits retry] → Stable identities and expected versions make both attempts converge; client state ignores superseded completion handling.
- [Moving navigation to clients reduces native no-JavaScript continuation] → Authenticated mutation surfaces are already client interactions and prioritize explicit, reliable outcomes.
- [Broad shared form locking can regress special forms] → Cover Card, Deck, archive/restore, study, login, sign-out, and recovery paths with focused integration tests.

## Migration Plan

1. Introduce outcome and synchronous form-lock primitives without changing action behavior.
2. Change services/actions to accept preassigned UUIDs and expected versions, then update callers and tests together.
3. Move domain post-success navigation into clients and add unconfirmed timeout handling.
4. Adopt the shared lock across remaining forms and remove redundant local-only guards.
5. Deploy without a database migration because the required primary keys and version columns already exist; roll back application code as one unit if outcome compatibility fails.

## Open Questions

None. The mutation semantics and timeout were resolved before proposal creation.
