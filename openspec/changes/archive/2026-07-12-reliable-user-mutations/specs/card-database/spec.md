## ADDED Requirements

### Requirement: Created records support retry identity

The system SHALL accept caller-preassigned UUID identities for new Deck, Card, and Card Review records so repeated attempts can address the same persistent result.

#### Scenario: New record uses preassigned identity

- **WHEN** an authorized create operation supplies a valid unused UUID
- **THEN** the database service SHALL persist the new Deck, Card, or Card Review with that UUID

#### Scenario: Owned identity already exists

- **WHEN** a retry supplies the UUID of the result previously created by the same mutation intent for the authenticated user
- **THEN** the database service SHALL return the existing first confirmed result without inserting or modifying another record

#### Scenario: Identity collides outside ownership

- **WHEN** a supplied UUID already identifies data outside the authenticated user's ownership
- **THEN** the system SHALL reject the mutation without exposing the other user's data

### Requirement: Mutable records reject stale writes

The system SHALL condition Card and Deck edits and Card Review scheduling changes on the persistent version observed by the initiating interaction.

#### Scenario: Card or Deck version is current

- **WHEN** an edit supplies the current persistent version of its owned Card or Deck
- **THEN** the system SHALL apply the edit and advance its version

#### Scenario: Card or Deck version is stale

- **WHEN** an edit supplies a version that another mutation has already advanced
- **THEN** the system SHALL reject the edit without overwriting the newer state

#### Scenario: Review scheduling version is current

- **WHEN** a Review supplies the scheduling version currently stored for its active owned Card
- **THEN** the system SHALL update scheduling and insert the immutable Review in one transaction

#### Scenario: Review scheduling version is stale

- **WHEN** a distinct Review intent supplies a scheduling version another Review has already advanced
- **THEN** the system SHALL reject the stale Review without changing scheduling or inserting review history

### Requirement: Retried Card image mutations clean auxiliary resources

The system SHALL make Card mutations converge without leaving image objects that are not referenced by the confirmed Card state.

#### Scenario: Concurrent Card creation attempt loses identity race

- **WHEN** concurrent attempts upload versioned images for one Card identity and only one attempt confirms the Card row
- **THEN** the system SHALL preserve images referenced by the confirmed Card and remove images uploaded only by losing attempts

#### Scenario: Existing Card creation is retried

- **WHEN** a retry finds the owned Card identity already confirmed
- **THEN** the system SHALL return that Card without replacing its content or retaining redundant retry uploads
