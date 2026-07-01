## Why

The app currently exposes its root page publicly, but the product direction requires the application to be accessible only after authentication. A passwordless Supabase Magic Link flow keeps the initial auth experience minimal while avoiding password setup, registration forms, and password recovery complexity.

## What Changes

- Add passwordless email authentication using Supabase Auth Magic Links.
- Replace separate register/login concepts with a single email entry flow that creates users automatically when needed.
- Protect the app root so unauthenticated users are redirected to login.
- Add an auth confirmation endpoint for Supabase email links.
- Show a minimal authenticated “Hola mundo” page after login.
- Do not add logout in this first version.

## Capabilities

### New Capabilities

- `passwordless-auth`: Covers Magic Link sign-in, automatic user creation, auth callback handling, and route protection for authenticated app access.

### Modified Capabilities

- `app-shell`: The root page changes from a public landing page to an authenticated app shell that only renders after login.

## Impact

- Affected code: Next.js App Router pages, a root proxy, Supabase client utilities, and auth Server Actions or route handlers.
- New dependencies: Supabase SSR/client packages and Zod for server-side email validation.
- External configuration: Supabase Auth email provider and redirect URLs must be configured for local and deployed environments.
- No database schema or flashcard data model changes are introduced.
