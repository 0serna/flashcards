## Context

Card rows persist immutable storage paths, but display code currently signs each path for one hour and renders the resulting Supabase URL directly with unoptimized `next/image`. A new signature changes the browser cache key on later visits, while images have no explicit loading or retry experience. The app has private Storage policies that authorize objects in active decks owned by the current user. Its PWA specification deliberately excludes Service Workers and offline runtime caching.

The agreed product boundary is a best-effort, 30-day browser-profile cache. It can remain after sign-out or an image change, and is not shared across devices. During study, only the front and back images for the next ten cards may be preloaded, and data-saving or slow-network hints suppress that work.

## Goals / Non-Goals

**Goals:**

- Provide one reusable rendering surface for private stored card images with loading, unavailable, and retry states.
- Give every immutable image version a same-origin, authenticated URL that the browser can cache privately for 30 days.
- Preserve ownership checks on every cache miss and allow cards that are archived while their owning deck remains active.
- Reduce perceived wait between cards without unbounded downloading.

**Non-Goals:**

- Offline study, Service Workers, Cache Storage, or a JavaScript-managed persistent media cache.
- Guaranteed retention when a browser evicts storage, cross-device cache sharing, or purging browser copies on sign-out, replacement, removal, or deck archival.
- New image alt-text authoring; existing generic front/back labels remain.
- Reoptimizing images through Next.js or changing upload validation and client-side image optimization.

## Decisions

### Use a versioned, authenticated application image route

A same-origin route will identify the deck, card, side, and immutable image version. It will authenticate the request, verify that the requested version is the image currently referenced by that card, verify that the deck is active and owned by the requester, and then retrieve and return the private Storage object. Archived cards remain eligible; archived decks do not.

The response will set `Cache-Control: private, max-age=2592000` and preserve the object content type. `private` confines reusable responses to the browser profile, while the 30-day max age implements the selected retention policy. Replacements already receive a UUID-bearing object path, so their versioned route changes and cannot reuse the prior image response. A removed or replaced version is rejected on future cache misses, although an existing browser copy can persist until expiry.

This replaces client-facing signed Storage URLs for card display. A direct signed URL has an hour-long, regenerated query token and therefore cannot provide a durable cache key. A route keyed only by deck/card/side was rejected because it would cache an old image after replacement.

### Keep image delivery outside the Next.js optimizer

The private route requires the browser session for its first request and already returns the upload-optimized object. The shared component will use a normal image element (or an explicitly unoptimized image element) against that route, preserving intrinsic width/height attributes and existing contain styling. Next's default optimizer was rejected because it fetches remote sources without forwarding authentication headers and its server cache lifetime is not the selected private-browser retention policy.

### Centralize presentation in a client image component

A reusable client component will receive the stable versioned source, dimensions, alt text, and styling. Until the image has loaded and decoded, it will reserve the image area with a neutral shimmer and accessible loading text. The shimmer is disabled under `prefers-reduced-motion`. It will switch to an unavailable state with accessible error text and a retry control when loading fails; retry remounts the request without changing the underlying image version.

Study faces and existing stored-image previews in the card editor will use this component. Newly selected `blob:` previews remain on the existing local-preview path because they do not have a private remote delivery or cache lifecycle.

### Preload a bounded forward window

After the current study card is available, the study client will warm browser cache entries for both sides of the following ten cards in session order, skipping absent images. It will never exceed 20 preloaded images. It will not start this work when the available browser connection information reports data saving or a slow effective connection; unsupported connection information leaves the normal bounded behavior intact.

Preloading the whole session was rejected because practice mode can include an unbounded active deck and images can be up to 5 MB each. A next-card-only preload was rejected because the selected ten-card window better covers short, continuous sessions while preserving the limit.

## Risks / Trade-offs

- [A private browser cache can expose an already downloaded image after sign-out or content removal] → This is an explicit product decision; responses remain profile-local and expire after 30 days.
- [Browser cache eviction can force another download before 30 days] → Treat retention as best effort and retain the loading state.
- [An image can fail after a long-open session or transient network error] → The unavailable state exposes a retry action, and the route obtains access to Storage only when a request reaches the server.
- [Preloading can consume bandwidth] → Limit it to 20 images and suppress it for browser data-saving and slow-network signals.
- [A route can accidentally expose a stale or unauthorized object] → Validate ownership, active-deck status, card-side association, and exact immutable version before fetching Storage.

## Migration Plan

1. Introduce the authorization lookup and versioned image route while retaining existing image-path persistence.
2. Change card display payloads to expose stable versioned application URLs rather than signed Storage URLs.
3. Adopt the shared component in study and existing-image editor surfaces, then enable bounded study preloading.
4. Deploy with the route and UI together; existing objects already have immutable UUID-bearing paths and require no data migration.
5. Roll back by restoring direct signed URL display. Browser-cached route responses remain local until their normal expiry but cannot be generated by the rolled-back UI.

## Open Questions

None.
