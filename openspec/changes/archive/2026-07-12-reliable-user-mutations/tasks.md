## 1. Mutation contracts and interaction guard

- [x] 1.1 Add failing tests for synchronous same-form locking, independent-form concurrency, blocked exit actions, and the 15-second unconfirmed transition.
- [x] 1.2 Define serializable confirmed/rejected domain mutation outcomes and client handling for absent responses.
- [x] 1.3 Implement a shared per-form synchronous submission guard with accessible busy state, pending-mutation integration, exit blocking, timeout cleanup, and late-response protection.
- [x] 1.4 Adopt the interaction guard in login, sign-out, recovery, Deck archive/restore, Card archive/restore, and any other forms without changing their domain semantics.

## 2. Retry-safe Deck mutations

- [x] 2.1 Add failing service and action tests for caller-preassigned Deck UUIDs, owned retry recovery, collision privacy, and stale edit rejection.
- [x] 2.2 Change Deck creation to validate and persist a client-preassigned UUID and return the first owned confirmed result on retry.
- [x] 2.3 Make Deck updates compare the submitted source version and return an explicit stale rejection without overwriting newer state.
- [x] 2.4 Update Deck create/edit forms to retain mutation identity across corrections and unconfirmed retries, consume explicit outcomes, and perform confirmed navigation on the client.

## 3. Retry-safe Card mutations and images

- [x] 3.1 Add failing service and action tests for caller-preassigned Card UUIDs, first-version authority, collision privacy, concurrent retry cleanup, and stale edit rejection.
- [x] 3.2 Change Card creation to validate and persist a client-preassigned UUID, recover an existing owned result before redundant uploads, and clean losing concurrent image versions.
- [x] 3.3 Make Card updates compare the submitted source version, converge safely on retry, and avoid orphaning superseded image objects.
- [x] 3.4 Update Card create/edit forms to retain one identity across both save actions, consume explicit outcomes, and move both Deck and new-Card continuations to client navigation.
- [x] 3.5 Add regression coverage proving a caught or lost creation response cannot create duplicate Cards and `Save and add another` generates a new identity only after confirmation.

## 4. Retry-safe Review recording

- [x] 4.1 Add failing tests for preassigned Review UUID recovery, same-intent retries, stale scheduling versions, and concurrent distinct Review attempts.
- [x] 4.2 Change Review recording to accept a preassigned UUID and expected `reviewCount`, recover an existing owned Review result, and atomically reject stale scheduling updates.
- [x] 4.3 Update study-session submission to create one Review identity per answer, preserve it through unconfirmed retries, and advance the queue only after confirmation.

## 5. Convergent transitions and navigation

- [x] 5.1 Add tests proving repeated Archive and Restore attempts return the requested final state without duplicate side effects.
- [x] 5.2 Refactor Deck and Card Archive/Restore actions to return explicit outcomes and move their post-confirmation navigation or refresh behavior to clients.
- [x] 5.3 Extend authenticated navigation tests to cover Cancel, breadcrumbs, Home, and browser Back during pending and after unconfirmed submissions.

## 6. Verification

- [x] 6.1 Run targeted Vitest suites for mutation services, actions, forms, study, and navigation and fix all underlying failures.
- [x] 6.2 Run `npm run test`, `npm run lint`, `npm run format`, `npm run db:check`, and `npm run build` successfully.
- [x] 6.3 Run `openspec validate reliable-user-mutations --type change --strict` and resolve every validation issue.
