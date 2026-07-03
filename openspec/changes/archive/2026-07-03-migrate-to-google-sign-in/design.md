## Context

The app currently uses Supabase Auth with a passwordless Magic Link flow. The login page collects an email address, calls `signInWithOtp`, and sends users through `/auth/confirm` to establish the session. Route protection already depends on Supabase SSR cookies and a public `/auth/*` allow-list, so Google OAuth can reuse the same session infrastructure.

The requested direction is Google sign-in as the only supported authentication method. Local development should continue to use Supabase CLI services, with `http://localhost:3000` as the canonical app origin. Production will use the hosted Supabase project and the production app domain.

## Goals / Non-Goals

**Goals:**

- Replace the Magic Link UI with a single Google sign-in action.
- Establish Supabase sessions after Google OAuth through a new `/auth/callback` route.
- Keep registration open to any Google account.
- Keep protected app routing and authenticated app behavior unchanged.
- Configure local Supabase Auth to support Google OAuth without committing provider secrets.

**Non-Goals:**

- Preserve or migrate existing Magic Link users.
- Add email/password, OTP, or multiple social providers.
- Add account linking, organization restrictions, or domain allow-lists.
- Change the database schema or ownership model.

## Decisions

- Use Supabase Google OAuth via `signInWithOAuth`.
  - Rationale: it keeps Supabase Auth as the session authority and works with the current SSR cookie integration.
  - Alternative considered: direct Google Identity Services in the app. Rejected because it would add token exchange and session-management complexity outside Supabase.

- Add `/auth/callback` instead of reusing `/auth/confirm`.
  - Rationale: `/auth/confirm` is Magic Link terminology. A callback route is clearer for OAuth and avoids carrying misleading product language forward.
  - Alternative considered: keep `/auth/confirm` because it already exchanges auth codes. Rejected because the route name would obscure the new flow.

- Keep `/auth/*` public in route protection.
  - Rationale: OAuth callbacks must be accessible before a session exists, and the existing prefix-based allow-list already supports that shape.
  - Alternative considered: allow only `/auth/callback`. Rejected for now because the current public auth prefix is simple and low risk.

- Use `http://localhost:3000` as the canonical local app origin.
  - Rationale: Supabase documentation identifies the local OAuth provider callback as `http://localhost:54321/auth/v1/callback`, and using `localhost` consistently avoids exact-redirect mismatches.
  - Alternative considered: keep `127.0.0.1:3000`. Rejected because it increases local OAuth URL mismatch risk.

- Store Google OAuth secrets in environment variables.
  - Rationale: Supabase local config can reference env vars and no provider secret should be committed.
  - Alternative considered: hard-code local credentials in `supabase/config.toml`. Rejected because credentials are sensitive.

## Risks / Trade-offs

- Google OAuth redirect URL mismatch → Document and configure exact local and production callback URLs in Google Cloud and Supabase Auth.
- Local Supabase Google provider needs credentials → Use env-var references in `supabase/config.toml` and require developers to provide local values.
- Existing Magic Link users may not map to Google users → Accepted because this app does not need to preserve existing auth identities.
- Removing email entry narrows access to users with Google accounts → Accepted because Google is now the only supported identity provider.

## Migration Plan

1. Add Google OAuth provider configuration for local Supabase using environment variables.
2. Replace the login form action with a Google OAuth sign-in action that redirects to `/auth/callback`.
3. Add `/auth/callback` to exchange the Supabase auth code for a session and redirect to `/` or `/login` with an OAuth error.
4. Remove Magic Link-specific UI states, messages, actions, validation, and tests.
5. Update specs and tests to reflect Google sign-in only.
6. Configure hosted Supabase and Google Cloud with the production callback and app redirect URLs before deployment.

Rollback: restore the previous Magic Link login action/form and `/auth/confirm` route expectations, then disable the Google provider in Supabase if needed.

## Open Questions

- What is the final production app domain for the hosted Supabase redirect allow-list?
