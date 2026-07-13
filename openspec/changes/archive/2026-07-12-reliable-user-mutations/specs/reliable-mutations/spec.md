## ADDED Requirements

### Requirement: Mutation attempts converge on one domain outcome

The system SHALL treat retries of one mutation intent as attempts to reach the same domain outcome rather than as new domain changes.

#### Scenario: Creation response is lost and retried

- **WHEN** a Deck, Card, or Review creation is committed but its client does not receive confirmation and retries the same mutation intent
- **THEN** the system SHALL return the first confirmed result without creating another Deck, Card, or Review

#### Scenario: Identical Card content belongs to distinct intentions

- **WHEN** a user deliberately begins two Card creation intents with identical front and back content
- **THEN** the system SHALL permit two distinct Cards

#### Scenario: Retry payload differs after creation

- **WHEN** a creation intent has already committed and a later attempt for the same identity contains changed content
- **THEN** the system SHALL preserve and acknowledge the first confirmed version without silently updating it

### Requirement: Domain mutation outcomes are explicit

Domain mutation actions SHALL return explicit confirmed or rejected outcomes without performing post-success navigation, and the client SHALL treat a missing response as unconfirmed.

#### Scenario: Mutation is confirmed

- **WHEN** a domain mutation is applied or its previously confirmed result is recovered
- **THEN** the action SHALL return a confirmed outcome and the client SHALL perform the selected continuation

#### Scenario: Mutation is definitively rejected

- **WHEN** validation, ownership, absence, or stale-version rules definitively prevent a domain mutation
- **THEN** the action SHALL return a rejected outcome and the client SHALL preserve the interaction for correction or recovery

#### Scenario: Mutation result cannot be confirmed

- **WHEN** the client has no confirmed or rejected result after 15 seconds
- **THEN** the client SHALL report that the outcome is unconfirmed and SHALL allow a retry using the same mutation identity

### Requirement: Every form prevents repeated rapid activation

The system SHALL synchronously lock each form interaction before asynchronous submission work so repeated pointer, keyboard, or programmatic activation cannot start another attempt for that interaction while it is pending.

#### Scenario: Submit control is activated repeatedly

- **WHEN** a user rapidly activates the same form submission more than once
- **THEN** only the first activation SHALL begin an attempt until the form settles or reaches the unconfirmed timeout

#### Scenario: Form has multiple submit actions

- **WHEN** a pending form exposes alternate submit actions
- **THEN** all submit actions for that form SHALL remain unavailable until the attempt settles or becomes unconfirmed

#### Scenario: Independent list forms submit

- **WHEN** separate forms on one screen represent separate mutation intents
- **THEN** locking one form SHALL NOT lock the other independent forms

#### Scenario: Authentication form submits

- **WHEN** an authentication, sign-out, or recovery form submits
- **THEN** the form SHALL use the same synchronous interaction lock even though it does not use domain idempotency outcomes

### Requirement: Pending forms prevent unsafe exit

The system SHALL prevent a user from leaving a form interaction while its submission is pending and SHALL restore exit behavior after it settles or becomes unconfirmed.

#### Scenario: User attempts form exit while pending

- **WHEN** a user activates Cancel, internal parent navigation, or authenticated browser Back during a pending form submission
- **THEN** the application SHALL remain on the current interaction

#### Scenario: Pending attempt becomes unconfirmed

- **WHEN** 15 seconds elapse without a mutation result
- **THEN** the application SHALL restore form exit controls and normal navigation while preserving safe retry identity

### Requirement: Alternate post-success continuations share one creation intent

The system SHALL keep mutation identity independent from the destination selected after confirmation.

#### Scenario: Save and add another is retried

- **WHEN** a user submits `Save and add another` and retries after an unconfirmed outcome
- **THEN** every attempt SHALL target the same Card identity and confirmation SHALL begin a new blank Card intent with a new identity

#### Scenario: Save and Save and add another coexist

- **WHEN** a Card creation form offers `Save` and `Save and add another`
- **THEN** both actions SHALL submit the same current Card identity and SHALL differ only in their client-side continuation after confirmation
