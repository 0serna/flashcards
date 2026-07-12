## ADDED Requirements

### Requirement: Versioned private card image delivery

The system SHALL expose each stored card image through a versioned, same-origin application URL rather than a client-facing Supabase signed URL. On a cache miss, the system SHALL authorize the current user against the image's current card side and active owning deck before returning the private object. An archived card's image SHALL remain available when its deck is active and owned by the current user.

#### Scenario: Owner requests an active card image

- **WHEN** an authenticated user requests the current versioned image URL for a side of a card in their active deck
- **THEN** the system SHALL return that private image with its stored content type

#### Scenario: Owner requests an archived card image in an active deck

- **WHEN** an authenticated user requests the current versioned image URL for a side of an archived card in their active deck
- **THEN** the system SHALL return that private image

#### Scenario: Unauthorized or inactive-deck image request

- **WHEN** a request is unauthenticated, belongs to a different user, targets an inactive deck, or does not match the card side's current image version
- **THEN** the system SHALL not return the private image

### Requirement: Private browser caching for image versions

The system SHALL mark a successfully delivered private card image response as browser-private with a maximum age of 30 days. A new image version SHALL use a different URL from the version it replaced.

#### Scenario: Browser reuses a recent image version

- **WHEN** the same browser profile requests an image version whose private response remains cached and fresh
- **THEN** the browser SHALL be permitted to reuse the cached response without a new image download

#### Scenario: Card image is replaced or removed

- **WHEN** a card image is replaced or removed
- **THEN** subsequent card rendering SHALL reference the replacement version or no image, and the system SHALL not serve the prior version on a future cache miss

#### Scenario: Browser has evicted a cached image

- **WHEN** a browser has evicted an image before its 30-day maximum age
- **THEN** the system SHALL obtain the image again through the authenticated application URL

### Requirement: Private card image loading and unavailable states

The system SHALL render private stored card images in study sessions and existing-card editing with a loading state until the image loads and decodes. The loading state SHALL reserve the image area, use a neutral shimmer with accessible loading text, and disable motion for users who prefer reduced motion. If loading fails, the system SHALL present accessible unavailable feedback and a retry control.

#### Scenario: Stored image is loading

- **WHEN** a study card face or existing-card editor preview begins loading a private stored image
- **THEN** the system SHALL display the loading state in the reserved image area until the image is ready

#### Scenario: Stored image finishes loading

- **WHEN** a private stored image loads and decodes successfully
- **THEN** the system SHALL replace its loading state with the image

#### Scenario: Stored image fails to load

- **WHEN** a private stored image cannot load
- **THEN** the system SHALL replace its loading state with unavailable feedback and a retry control

#### Scenario: User retries an unavailable image

- **WHEN** a user activates retry for an unavailable private stored image
- **THEN** the system SHALL issue a new request for that image version and render the resulting loading, available, or unavailable state

### Requirement: Bounded study image preloading

The system SHALL preload both stored image sides of the next ten cards in the current study-session order after the current card, with no more than 20 preloaded images. The system SHALL skip this preloading when browser connection information indicates data saving or a slow connection.

#### Scenario: Normal connection preloads next cards

- **WHEN** a study session has image-bearing cards after the current card and the browser does not indicate data saving or a slow connection
- **THEN** the system SHALL preload the front and back images of up to the next ten cards in session order

#### Scenario: Preload limit is reached

- **WHEN** more than ten cards follow the current card
- **THEN** the system SHALL not preload images beyond the next ten cards

#### Scenario: Browser requests data saving or reports a slow connection

- **WHEN** browser connection information indicates data saving or a slow connection
- **THEN** the system SHALL not preload upcoming card images and SHALL continue to load an image when it is displayed
