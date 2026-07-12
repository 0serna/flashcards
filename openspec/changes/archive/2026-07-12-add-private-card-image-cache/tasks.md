## 1. Versioned private image delivery

- [x] 1.1 Confirm the versioned authenticated image-route seam and its route response contract for tests.
- [x] 1.2 Add failing route/service tests for owned active-deck access, archived-card access, rejected unauthorized/inactive/stale-version requests, content type, and 30-day private cache headers.
- [x] 1.3 Add a card-image URL projection that uses an immutable object version, and carry it through study and existing-card edit payloads without exposing signed Storage URLs.
- [x] 1.4 Implement the owned-card-image lookup and authenticated image route that validates the current side version and streams the private Storage object.
- [x] 1.5 Make the route tests pass and preserve existing card image service coverage.

## 2. Shared image presentation

- [x] 2.1 Confirm the shared image-component seam and its loading, reduced-motion, unavailable, and retry behavior.
- [x] 2.2 Add failing component tests for loading-to-ready, unavailable feedback, retry, reduced motion, and cached-image completion behavior.
- [x] 2.3 Implement the reusable private card image component with reserved loading area, neutral shimmer, accessible status text, and retry handling.
- [x] 2.4 Replace study and existing-card editor remote-image rendering with the shared component while retaining local `blob:` previews.
- [x] 2.5 Make the component and affected study/form tests pass.

## 3. Bounded study preloading

- [x] 3.1 Confirm the study-session preloading seam and browser connection-signal behavior.
- [x] 3.2 Add failing study-session tests for preloading both image sides of the next ten cards, skipping absent images, enforcing the 20-image limit, and suppressing work for data-saving or slow connections.
- [x] 3.3 Implement bounded forward preloading using the versioned application image URLs.
- [x] 3.4 Make the study preloading tests pass without changing study ordering or rating behavior.

## 4. Verification

- [x] 4.1 Verify that the implementation registers no Service Worker, Serwist integration, Cache Storage usage, or JavaScript-managed persistent media cache.
- [x] 4.2 Run `npm run test`, `npm run lint`, `npm run db:check`, and `npm run build`; fix all reported issues.
