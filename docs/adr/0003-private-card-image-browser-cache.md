# Cache private card images in browser profiles

Private card images will use a stable, authenticated application route versioned by immutable storage object and a best-effort private browser cache retained for 30 days per browser profile. This avoids repeat downloads across daily study while preserving ownership checks on cache misses; a cached copy may remain after sign-out, image replacement, removal, or deck archival until its expiry. The app will not add a Service Worker or JavaScript-managed media cache: those alternatives increase private-media persistence and lifecycle complexity beyond the intended online experience.

## Consequences

Image access remains authorized only for cards in an active deck owned by the current user, including archived cards. Study preloading loads the front and back images for the next 10 cards, yields to browser data-saving and slow-network preferences, and remains limited to 20 images; the browser may evict cached images before 30 days.
