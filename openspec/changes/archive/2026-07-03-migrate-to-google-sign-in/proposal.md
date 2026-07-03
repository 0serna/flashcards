## Why

The current Magic Link flow depends on email delivery and template behavior that is not fully controllable on the current Supabase setup. Google sign-in removes email-template friction while keeping authentication passwordless and compatible with both local Supabase development and production Supabase Auth.

## What Changes

- **BREAKING**: Replace Magic Link login with Google sign-in as the only supported authentication method.
- Add a Google OAuth login action from `/login`.
- Add a dedicated OAuth callback route at `/auth/callback` that exchanges the Supabase auth code for a session.
- Remove the user-facing Magic Link request and “check your email” states.
- Keep open registration: any Google account may create a Supabase Auth user.
- Standardize local app redirects on `http://localhost:3000`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `passwordless-auth`: Replace email Magic Link requirements with Google OAuth sign-in, callback handling, and public auth route behavior.

## Impact

- Affected code: login page/form, login server action, auth callback route, auth tests, Supabase local auth configuration, and proxy route allow-list tests if route expectations change.
- External configuration: Google Cloud OAuth client IDs/secrets, local Supabase Google provider config, hosted Supabase Google provider config, and local/production redirect URL allow-lists.
- No database schema changes are required.
