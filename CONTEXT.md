# Flashcards

Flashcards is a personal study app where authentication gates access to user-owned study material.

## Language

**Google sign-in**:
A sign-in flow where a visitor uses a Google account as the only supported identity provider for establishing a session.
_Avoid_: Magic Link, email code sign-in, password login

**Sign-out**:
Ending the current authenticated session for the user in this browser/device without changing their Google account or study material.
_Avoid_: account deletion, Google account logout, deck reset

**Deck**:
A user-owned collection of cards grouped for study.
_Avoid_: folder, set, stack

**Card**:
A study item inside a deck with a front prompt and a back answer; each side can contain text, an image, or both.
_Avoid_: flashcard, note, question

**Archived card**:
A card removed from active study and the active card list without physically deleting its content or images; it can be restored from an archived view.
_Avoid_: deleted card, trashed card, removed card

**Review**:
A study mode for cards whose scheduling state says they are due to be answered now.
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
