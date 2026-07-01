## Context

The repository currently only contains stack guidance. The first implementation step must create a small Next.js foundation for a personal flashcards app without introducing backend, authentication, database, UI component libraries, or offline caching complexity.

The app is intended to be mobile-first and installable as a PWA on a phone. The first cut only needs the installability metadata and assets; it does not need offline behavior.

## Goals / Non-Goals

**Goals:**

- Initialize a minimal Next.js App Router project with TypeScript, Tailwind CSS, ESLint, npm, and `src/`.
- Provide a visible `Flashcards` hello-world landing page.
- Add a valid web app manifest and placeholder icons for basic mobile installation.
- Keep the initial implementation small and easy to extend.

**Non-Goals:**

- No flashcard CRUD, study sessions, persistence, sync, or user accounts.
- No Supabase, Drizzle, Supabase Auth, route handlers, or server actions.
- No shadcn/ui, Lucide, React Hook Form, Zod, or TanStack Query.
- No Service Worker, Serwist, custom caching, or offline support.

## Decisions

- Use `create-next-app` as the project initializer.
  - Rationale: it creates the canonical Next.js structure and current config defaults with less manual setup.
  - Alternative considered: hand-write project files. Rejected because it is more error-prone for the initial scaffold.

- Use npm for dependency management.
  - Rationale: explicitly selected for this repo and produces a standard `package-lock.json`.
  - Alternative considered: pnpm. Rejected for this change because the repo preference is npm.

- Use `src/` and the `@/*` import alias.
  - Rationale: keeps application code separate from root config and public assets while preserving common Next.js conventions.
  - Alternative considered: root-level `app/`. Rejected because moving later is unnecessary churn.

- Implement minimum PWA installability with manifest and icons only.
  - Rationale: mobile installation needs metadata and icons; offline support is not needed for the first shell.
  - Alternative considered: Serwist or manual Service Worker now. Rejected to avoid premature caching complexity.

- Generate simple placeholder icons.
  - Rationale: installability needs icon assets before brand design exists.
  - Alternative considered: no icons. Rejected because it would undercut installability requirements.

## Risks / Trade-offs

- No offline support → Accept for the first cut; add Serwist or a Service Worker in a later change when caching requirements are known.
- Placeholder branding → Accept as temporary; replace icons when visual identity is defined.
- Browser-specific install behavior can vary → Keep manifest standards-compliant and test on localhost/HTTPS during implementation.
