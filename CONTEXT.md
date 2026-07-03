# Flashcards

Flashcards is a personal study app where authentication gates access to user-owned study material.

## Language

**Google sign-in**:
A sign-in flow where a visitor uses a Google account as the only supported identity provider for establishing a session.
_Avoid_: Magic Link, email code sign-in, password login

**Sign-out**:
Ending the current authenticated session for the user in this browser/device without changing their Google account or study material.
_Avoid_: account deletion, Google account logout, deck reset
