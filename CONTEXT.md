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
A user-owned collection of flashcards grouped for study.
_Avoid_: folder, set, stack

**Flashcard**:
A study item inside a deck with a front prompt and a back answer; each side can contain text, an image, or both.
_Avoid_: card, note, question

**Archived flashcard**:
A flashcard removed from active study and the active flashcard list without physically deleting its content or images; it can be restored from an archived view.
_Avoid_: deleted card, trashed card, removed card
