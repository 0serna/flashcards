## Why

A successful Card creation can currently be reported as failed when the client catches Next.js redirect control flow, allowing a user to retry and create duplicate Cards. More broadly, rapid activation and uncertain network responses can repeat persistent mutations without a stable identity or trustworthy outcome.

## What Changes

- Introduce a common mutation-intent contract with confirmed, rejected, and unconfirmed outcomes.
- Separate domain mutation results from client-side post-success navigation.
- Preassign stable record UUIDs for Deck creation, Card creation, and Review recording so retries converge on one database result without content-based deduplication.
- Add synchronous per-form submission locks to every form, including authentication forms, and block form exit while a submission is pending.
- After 15 seconds without a result, report an unconfirmed outcome and permit a safe retry using the same intent identity.
- Treat `Save` and `Save and add another` as alternate continuations of the same Card creation intent.
- Reject stale Card and Deck edits and stale Review answers rather than overwriting or advancing newer state.
- Keep Archive and Restore as convergent state transitions and preserve image cleanup across retries.

## Capabilities

### New Capabilities

- `reliable-mutations`: Defines mutation identities, outcomes, retry behavior, submission locking, and post-success continuations.

### Modified Capabilities

- `app-shell`: Pending submissions block all form exits and navigation until settled or declared unconfirmed.
- `card-database`: Decks, Cards, and Reviews accept preassigned identities, and mutable version checks reject stale edits and Review answers.

## Impact

This affects shared form primitives, authenticated navigation state, Deck and Card forms/actions/services, archive and restore controls, study rating submission, login and recovery forms, Drizzle database access and tests, and mutation-related OpenSpec contracts. Existing Server Action signatures and navigation ownership will change; no new runtime dependency is expected.
