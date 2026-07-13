# Flashcards

Flashcards is a personal study app where authentication gates access to user-owned study material.

## Language

**Google sign-in**:
A sign-in flow where a visitor uses a Google account as the only supported identity provider for establishing a session.
_Avoid_: Magic Link, email code sign-in, password login

**Sign-out**:
Ending the current authenticated session for the user in this browser/device without changing their Google account or study material.
_Avoid_: account deletion, Google account logout, deck reset

**Upward navigation**:
Navigation from the current authenticated screen to its immediate parent in the app hierarchy, regardless of browser history; it stops at Home.
_Avoid_: browser back, chronological back, history navigation

**Home**:
The root authenticated screen and terminal destination of upward navigation.
_Avoid_: previous page, landing page

**App update**:
The replacement of the app release currently loaded on a device with the active production release whenever their identities differ, including after a production rollback.
_Avoid_: upgrade, data migration, offline update

**Deck**:
A user-owned collection of cards grouped for study.
_Avoid_: folder, set, stack

**Card**:
A study item inside a deck with a front prompt and a back answer; each side can contain text, an image, or both.
_Avoid_: flashcard, note, question

**Mutation intent**:
A user's decision to make one persistent domain change, such as creating a card, archiving a deck, or recording one review answer. It may produce multiple submission attempts because of repeated input, retries, uncertain responses, or corrections after an error, but it applies the domain change at most once. The intent ends when the change succeeds or its form or interaction is closed or reset. Alternative post-success destinations, such as “Save” and “Save and add another,” belong to the same intent; “Save and add another” begins a new intent only after the prior one succeeds.
_Avoid_: submission, request, click

**Mutation attempt**:
One technical submission made for a mutation intent and carrying that intent's opaque identifier; repeating an attempt does not represent another domain change unless the user starts a new mutation intent. Attempts may execute more than once technically, but they must converge on the same domain outcome and must not leave orphaned auxiliary resources. Distinct creation intents may legitimately produce cards with identical content. Once an attempt applies the change, that first confirmed result is authoritative and later attempts acknowledge it as success without silently changing it.
_Avoid_: domain change, duplicate card, content-based duplicate

**Mutation outcome**:
The known result of a mutation intent: confirmed when the domain change was applied, rejected when it was definitively not applied, or unconfirmed when the client cannot determine either result. An unconfirmed outcome preserves the same intent so it can be retried safely.
_Avoid_: treating every transport error as rejection, failed mutation when the result is unknown

**Stale mutation**:
A mutation intent based on a persistent version that another intent has already changed. Stale Card and Deck edits and stale Review answers are rejected rather than silently overwriting or advancing newer state; convergent Archive and Restore transitions do not conflict merely because their source view is old.
_Avoid_: last write wins, duplicate attempt

**Archived card**:
A card removed from active study and the active card list without physically deleting its content or images; it can be restored from an archived view.
_Avoid_: deleted card, trashed card, removed card

**Review**:
A study mode for cards whose scheduling state says they are due to be answered now. Each recorded answer applies to the scheduling version shown to the user; it is stale and must not change scheduling if another review has already advanced that version.
_Avoid_: practice, quiz, test

**Practice**:
A manual study mode for active cards outside the due-only review queue.
_Avoid_: review, quiz, test

**Spaced repetition**:
A scheduling approach that decides when a card should be reviewed again based on prior recall outcomes.
_Avoid_: streak system, quiz score, game progression

**Study session**:
An ephemeral run where a user answers cards from one deck; each answer is saved independently as review history.
_Avoid_: saved session, test attempt, exam

**Session queue**:
The ordered, stable list of cards captured when a study session begins; saving answers or refreshing server data does not replace it during that session.
_Avoid_: live due list, persisted session, deck order

**Private image cache**:
A best-effort browser-profile cache of private card images that speeds up repeat study and may remain available for 30 days after sign-out.
_Avoid_: shared media library, account-wide cache

**Image loading state**:
A temporary neutral presentation with subtle motion and accessible text for a private card image in a study session or card editing while its content is still loading; motion is removed when the user prefers reduced motion.
_Avoid_: card loading state, session loading state

**Image unavailable state**:
A recoverable presentation for a private card image that cannot load, which explains the failure and lets the user retry.
_Avoid_: missing card content, silently hidden image

**Study image preloading**:
The advance loading of the front and back images for the next 10 cards in the current study session, limited to 20 images, that yields to browser data-saving and slow-network preferences.
_Avoid_: unbounded deck download, full offline sync

**Private image access**:
Authorization to load an image belonging to an active or archived card only when its deck is active and owned by the current user.
_Avoid_: public image access, archived-deck access
