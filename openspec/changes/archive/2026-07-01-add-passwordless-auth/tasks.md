## 1. Dependencies and configuration

- [x] 1.1 Add Supabase SSR/client packages and Zod dependencies.
- [x] 1.2 Define required Supabase environment variable usage for URL and publishable key.

## 2. Supabase auth infrastructure

- [x] 2.1 Create server-side Supabase client utility using App Router cookies.
- [x] 2.2 Create proxy/session update utility for Supabase cookie refresh and user detection.
- [x] 2.3 Add `src/proxy.ts` to protect `/`, keep `/login` and `/auth/confirm` public, and exclude framework/PWA assets.

## 3. Passwordless login flow

- [x] 3.1 Add server-side email validation schema.
- [x] 3.2 Add Magic Link request action using `signInWithOtp` with automatic user creation.
- [x] 3.3 Add `/login` page with a single email form and post-submit “check your email” state.
- [x] 3.4 Add `/auth/confirm` route handler to verify Supabase token hashes and redirect to `/` or `/login`.

## 4. Protected app shell

- [x] 4.1 Update the root page to render the authenticated “Hola mundo” content.
- [x] 4.2 Ensure authenticated users requesting `/login` are redirected to `/`.

## 5. Verification

- [x] 5.1 Add or update tests for email validation and manifest/asset access if applicable.
- [x] 5.2 Run the project quality check suite and fix any reported issues.
