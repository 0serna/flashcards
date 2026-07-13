## 1. Release Identity and Endpoint

- [x] 1.1 Add failing tests for release identity availability, the public endpoint payload, explicit no-store behavior, and missing-metadata behavior.
- [x] 1.2 Inject a unique opaque release ID into every production workflow build and expose it through a shared release metadata module.
- [x] 1.3 Implement the public non-cacheable release endpoint and exclude it from Supabase session proxy processing.

## 2. Pending Mutation Coordination

- [x] 2.1 Add failing tests for immediate readiness, settlement notification, concurrent mutations, 15-second timeout, and waiter cleanup.
- [x] 2.2 Extend the pending-mutation module with a bounded async wait interface while preserving existing mutation and navigation behavior.

## 3. Authenticated Update Experience

- [x] 3.1 Add failing component tests for initial and foreground checks, matching and differing identities, silent failures, deduplicated checks, no periodic polling, and missing release metadata.
- [x] 3.2 Add failing interaction tests for the persistent accessible `Update` action, bounded mutation waiting, timeout recovery, current-context reload, and dirty-form unload protection.
- [x] 3.3 Implement the release update client component and place its compact secondary action beside the logo in the shared authenticated header only.
- [x] 3.4 Verify the header at narrow mobile widths and with keyboard and screen-reader semantics, without exposing release details or adding decorative motion.

## 4. Verification

- [x] 4.1 Confirm the implementation registers no Service Worker and adds no offline cache, background polling, cross-window reload coordination, or new runtime dependency.
- [x] 4.2 Run formatting, the full Vitest suite, ESLint, the production build, and Drizzle schema validation; fix every reported issue.
- [x] 4.3 Validate the OpenSpec change and verify its scenarios are covered by automated tests or an explicit browser check.
