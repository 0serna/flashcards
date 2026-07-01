## Context

The current app is a minimal Next.js App Router PWA shell with a public root page. The desired first authenticated experience is intentionally small: unauthenticated users enter with an email Magic Link, Supabase creates accounts automatically when needed, and authenticated users see a protected “Hola mundo” screen.

The project uses Next.js 16, so request-time route protection should use `proxy.ts` rather than the older `middleware.ts` convention. Supabase SSR auth stores and refreshes sessions through cookies, which makes route protection and server rendering compatible with App Router.

## Goals / Non-Goals

**Goals:**

- Provide one passwordless entry screen for both login and registration.
- Use Supabase Auth Magic Links with automatic user creation.
- Protect the root app route from unauthenticated access.
- Handle Supabase email confirmation server-side and redirect authenticated users into the app.
- Keep the authenticated app content to a minimal “Hola mundo” screen.

**Non-Goals:**

- Password-based login, password reset, or separate registration UI.
- Logout UI in this first version.
- User profile management.
- Database tables, Drizzle models, flashcard persistence, or row-level security policies.
- OAuth providers or phone OTP.

## Decisions

- Use Supabase Magic Link instead of passwords.
  - Rationale: it removes password creation, password recovery, and separate registration from the first auth flow.
  - Alternative considered: email/password login and signup. Rejected because it adds more UI and account-management states than needed now.

- Use a single `/login` route for both sign-in and sign-up.
  - Rationale: Supabase `signInWithOtp` can create users automatically when `shouldCreateUser` is enabled, matching the accepted open-registration model.
  - Alternative considered: separate `/signup`. Rejected because it duplicates the same email-only interaction.

- Use `/auth/confirm` as the Supabase email confirmation endpoint.
  - Rationale: server-side token verification keeps the session cookie flow compatible with App Router SSR.
  - Alternative considered: client-side confirmation. Rejected because the server needs to establish cookies reliably for protected rendering.

- Use `src/proxy.ts` for route protection.
  - Rationale: Next.js 16 documents `proxy.ts` as the current convention and it can redirect before protected pages render.
  - Alternative considered: only checking in the page component. Rejected because it would not provide centralized request filtering.

- Keep logout out of scope.
  - Rationale: the first required authenticated state only needs entry and protected content; logout was explicitly deferred.

## Risks / Trade-offs

- Magic Link deliverability or opening the link in a different browser can prevent immediate login → keep the UI message explicit that the user must check email and use the link.
- Open registration allows any email to create an account → accepted for this version.
- Missing Supabase redirect URL configuration will break confirmation → document required local and production redirect URLs through environment/setup notes in implementation output, not as generated docs.
- Without logout, manual testing of user switching is less convenient → accepted as a deferred limitation.
