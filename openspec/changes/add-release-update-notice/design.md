## Context

The app is an installable Next.js 16 PWA shell deployed as a prebuilt Vercel production artifact. It intentionally has no Service Worker or offline runtime cache, so an open client keeps its loaded JavaScript until a document reload. The authenticated shell already centralizes its header, dirty-form state, and pending-mutation state.

Production deployments are initiated by GitHub Actions rather than Vercel Git integration. The workflow can therefore assign a unique opaque identity before `vercel build`. The loaded client needs that build identity, while an unpinned custom fetch to the production alias can read the identity of whichever deployment is currently active.

## Goals / Non-Goals

**Goals:**

- Detect when an authenticated client has a different release from active production.
- Offer a compact, explicit update action without interrupting the current task automatically.
- Preserve unsaved-change and in-flight mutation safety.
- Detect both forward deployments and production rollbacks.
- Keep release checks cheap, public, non-cacheable, and independent from user sessions.

**Non-Goals:**

- Offline support, runtime asset caching, a Service Worker, Web Push, or background sync.
- Semantic versioning, release notes, forced updates, or periodic polling.
- Coordinating reloads across tabs or windows.
- Showing the update control on login or global error surfaces.

## Decisions

### Use a workflow-generated build identity

The production workflow will derive a unique opaque release ID from the GitHub workflow run and attempt, expose it to `vercel build` as `NEXT_PUBLIC_APP_RELEASE_ID`, and build it into both the client and release endpoint. Equality, not ordering, determines whether an update exists, so a rollback is detected in the same way as a forward release.

A deployment identity is preferred over a commit SHA because redeploying the same commit must still count as a distinct release. A semantic version is rejected because the current deployment process does not publish product versions and ordering would mishandle rollbacks.

This change will not add a Next.js `deploymentId`; that setting has separate version-skew behavior and can cause framework-managed navigations to reload automatically when deployments are not pinned, conflicting with the chosen voluntary update interaction. Existing Vercel project-level skew protection remains independent.

### Expose an unpinned, non-cacheable release endpoint

A public `GET /api/release` route will return only the active opaque release ID. It will set explicit no-store response headers, and clients will request it with `cache: "no-store"`. The route will be excluded from the Supabase session proxy because it exposes no user data and runs on every check.

The client uses a normal custom fetch without a deployment pin so the production alias resolves it against the active deployment even if framework-managed requests use Vercel Skew Protection. Missing release metadata disables detection outside production rather than producing false updates.

### Check only on mount and foreground return

A client component in the authenticated header will compare its build-time release ID with the endpoint response when it mounts and whenever the document becomes visible or its window regains focus. Concurrent checks will be deduplicated, and each successful response will reconcile the visible state rather than permanently latching it. Failed checks remain silent and can retry on the next foreground event.

An interval is rejected because the agreed freshness boundary is foreground return and continuous polling adds requests without meaningful benefit for short mobile sessions.

### Present one compact secondary action in the authenticated header

When identities differ, the shared header will render a touch-sized secondary `Update` button directly after the Flashcards logo and before the account menu. It will expose no release number or details, remain visible while the mismatch exists, and use an accessible live status for its appearance and waiting state. It is an action, not a new navigation destination.

The control will not render on login or global error surfaces because those surfaces do not use the authenticated header. A modal, toast, and full-width banner are rejected as unnecessarily disruptive for the Quiet Study Desk interface.

### Reload the current context after bounded mutation coordination

Activating `Update` will wait for the global pending-mutation count to reach zero, up to 15 seconds. The pending-mutation module will own an async waiting interface so callers do not poll or manipulate its count. If the timeout expires, the update attempt ends and the persistent action becomes available again without reloading.

Once safe, `window.location.reload()` performs a document reload of the current URL. The existing `beforeunload` guard supplies the browser-native confirmation for dirty forms; declining it leaves the app and update action intact. A Study session receives no extra confirmation, and only the current browsing context reloads. No connectivity preflight is performed, so an offline click may reach the browser's network error surface as explicitly accepted.

## Risks / Trade-offs

- **A continuously visible session does not detect a release** → Detection runs again on the next focus or visibility return; the user can also reload normally.
- **A voluntary update leaves an old client active** → Keep the action persistent and non-dismissible; existing platform skew protection and application recovery remain separate safeguards.
- **An offline update click can replace the app with a browser error** → This is an accepted consequence of attempting the requested reload without a preflight.
- **A hung mutation delays updating** → Bound the wait to 15 seconds and never reload while the mutation remains pending.
- **Release metadata is absent in a non-workflow deployment** → Disable comparison instead of reporting a false mismatch; the production workflow and tests enforce metadata injection.
- **Two foreground events can overlap** → Deduplicate in-flight checks and ignore completions after component teardown.

## Migration Plan

1. Add release metadata to the production build workflow and deploy the endpoint and client control together.
2. The first deployment containing the mechanism establishes the first detectable identity; already-open older clients cannot discover it because they do not yet contain the checker.
3. From the following deployment onward, open clients with the mechanism can detect active-release changes.
4. Rollback by restoring the prior code and deployment workflow; clients that already contain the checker will treat the restored deployment as a differing active release and offer `Update`.

## Open Questions

None.
