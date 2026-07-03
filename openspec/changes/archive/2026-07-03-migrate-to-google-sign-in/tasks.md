## 1. Supabase and OAuth configuration

- [x] 1.1 Update `supabase/config.toml` to enable the Google external auth provider using environment-variable references for client id and secret.
- [x] 1.2 Standardize local auth redirect configuration on `http://localhost:3000/auth/callback` while keeping required local Supabase callback compatibility.
- [x] 1.3 Add or update tests that assert `/auth/callback` remains public to unauthenticated requests.

## 2. OAuth callback

- [x] 2.1 Add `/auth/callback` route handler that exchanges a valid Supabase auth code for a session and redirects to `/`.
- [x] 2.2 Handle missing, invalid, or throwing callback exchanges by redirecting to `/login` with a Google sign-in error.
- [x] 2.3 Remove Magic Link token-hash confirmation behavior and update callback route tests.

## 3. Login flow

- [x] 3.1 Replace the Magic Link server action with a Google OAuth sign-in action using `signInWithOAuth` and `/auth/callback` as `redirectTo`.
- [x] 3.2 Replace the email input and check-email state with a single Google sign-in control built from shared UI components.
- [x] 3.3 Update login page error copy to describe failed Google sign-in instead of invalid Magic Links.
- [x] 3.4 Remove email validation and resend-link UI behavior that is no longer used.

## 4. Tests and quality gates

- [x] 4.1 Update login action, login form, login page, and proxy tests for Google-only sign-in.
- [x] 4.2 Remove or adapt tests that assert Magic Link request, email validation, and `/auth/confirm` behavior.
- [x] 4.3 Run `npm run check` and fix all reported issues.
