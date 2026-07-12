## Why

Authenticated browser Back currently follows chronological history, which can revisit completed forms, leave the app from Home, or produce destinations inconsistent with the breadcrumb hierarchy. Mobile navigation gestures should instead behave predictably as upward navigation within the app.

## What Changes

- **BREAKING**: Redefine browser Back on authenticated screens to navigate to the immediate hierarchical parent rather than the previous history entry.
- Make Home the absolute root: Back on Home remains on Home, including after entry from an external site.
- Neutralize browser Forward so it cannot reopen descendant screens.
- Preserve unsaved-change confirmation before upward navigation from dirty Deck and Card forms.
- Ignore Back while a save, archive, restore, or study-rating mutation is pending.
- Exit Review and Practice directly to the owning Deck without traversing session UI state.
- Preserve normal browser-history behavior on `/login` and other unauthenticated surfaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: Expand deterministic parent navigation into enforced hierarchical browser navigation for authenticated screens, with Home as the terminal root.

## Impact

- Affects the authenticated app shell, browser history handling, route-to-parent mapping, dirty-form protection, pending mutation state, navigation loading feedback, and related tests.
- Changes expected Back and Forward behavior in browsers and installed PWA contexts.
- Does not change routes, server APIs, persistence schemas, or external dependencies.
