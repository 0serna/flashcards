## Why

Private card images can appear blank while they download and are fetched again when their one-hour signed URLs change. This interrupts short repeat study sessions, especially for users who return daily to the same material.

## What Changes

- Add a reusable private card image experience with loading, unavailable, and retry states for study and existing-card editing.
- Deliver private card images through a stable, immutable-versioned authenticated application URL so a browser can reuse them for up to 30 days within the same browser profile.
- Preload both images for the next ten cards during study, subject to browser data-saving and slow-network preferences.
- Preserve private-media boundaries: access remains limited to an owned active deck; cached browser copies are best-effort and can remain until expiry after sign-out, image replacement, removal, or deck archival.
- Clarify that the PWA continues to exclude Service Workers and app-managed offline media caches while allowing this private HTTP browser cache.

## Capabilities

### New Capabilities

- `private-card-image-experience`: Authenticated stable delivery, browser caching, loading/error presentation, and bounded study preloading for private card images.

### Modified Capabilities

- `installable-pwa`: Clarify the no-offline-caching boundary while permitting private HTTP browser caching for card images.

## Impact

- Affected code: card image storage services, authenticated image route handling, study session rendering, card editing previews, and shared image UI.
- Affected systems: Supabase Storage signed-object access and browser HTTP caching.
- No new dependency, Service Worker, or JavaScript-managed persistent media cache is introduced.
