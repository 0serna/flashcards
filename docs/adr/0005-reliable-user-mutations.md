# Make user mutations retry-safe and separate them from navigation

Persistent user interactions are modeled as mutation intents that may produce multiple technical attempts but must converge on one domain outcome. Domain Server Actions return explicit outcomes and leave post-success navigation to the client; this prevents framework redirects from being mistaken for failures and makes confirmed, rejected, and unconfirmed outcomes distinguishable.

New Cards, Decks, and Reviews receive their record UUID before the first attempt, so retries reuse primary-key identity rather than relying on content deduplication or a generic idempotency ledger. Convergent transitions such as Archive and Restore remain naturally idempotent, while stale Card and Deck edits and stale Review answers are rejected instead of overwriting newer state.

All forms use a synchronous per-intent submission lock against rapid repeated activation. If no outcome is available after 15 seconds, the UI reports an unconfirmed result and permits a safe retry with the same identity. Alternative continuations such as “Save” and “Save and add another” share the same mutation intent and differ only in client navigation after confirmation.
