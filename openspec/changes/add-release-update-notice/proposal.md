## Why

Installed or long-running app sessions can remain on an older production release without telling the user. Users need a calm, explicit way to discover that the active release changed and reload when they choose, without introducing offline caching or a Service Worker.

## What Changes

- Give every production deployment an opaque, unique release identity and expose the active identity through a public, non-cacheable endpoint.
- Compare the release loaded by an authenticated client with the active production release when the client starts and returns to the foreground.
- Show a compact, persistent `Update` action beside the Flashcards logo when the identities differ, including after a production rollback.
- Reload only the current app window and preserve its URL when the user activates `Update`.
- Protect unsaved form changes and wait up to 15 seconds for an in-flight mutation before updating.
- Keep automatic check failures silent and retain the current no-Service-Worker, no-offline behavior.

## Capabilities

### New Capabilities

- `release-update-notice`: Detects a different active production release and lets an authenticated user explicitly reload the current app window.

### Modified Capabilities

None.

## Impact

- Production deployment workflow and build environment release metadata.
- A new public release identity endpoint and proxy exclusions.
- Shared authenticated header and client-side foreground detection.
- Pending-mutation coordination and unsaved-change reload behavior.
- Automated tests for release comparison, update interaction, endpoint caching, and deployment metadata.
- No new runtime dependency, Service Worker, offline cache, or breaking API change.
