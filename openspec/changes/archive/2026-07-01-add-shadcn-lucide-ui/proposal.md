## Why

The project already has a minimal Next.js, TypeScript, and Tailwind CSS v4 foundation, but the UI stack is incomplete. Adding shadcn/ui and Lucide now establishes a consistent component and icon baseline while the existing interface is still small.

## What Changes

- Add shadcn/ui as the project's UI component baseline using the `new-york` style and `neutral` base color.
- Add Lucide icons support through `lucide-react` and shadcn's icon library configuration.
- Add the shadcn utility and configuration needed to generate and use local UI components.
- Introduce initial UI primitives for the existing login form: button, input, and label.
- Align global styling with shadcn CSS tokens while preserving the current mobile-first app shell behavior.

## Capabilities

### New Capabilities

- `ui-component-system`: Defines the local shadcn/ui component baseline, theme tokens, and Lucide icon availability for application UI.

### Modified Capabilities

- `passwordless-auth`: Updates the login form presentation to use the shared UI component baseline without changing authentication behavior.

## Impact

- Affected code: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/login/login-form.tsx`, `src/lib/utils.ts`, `src/components/ui/*`, `components.json`.
- Dependencies: add shadcn-related component dependencies and `lucide-react`.
- APIs: no route, server action, or authentication contract changes.
- User experience: login controls may receive minor visual changes from shadcn styling and theme tokens.
