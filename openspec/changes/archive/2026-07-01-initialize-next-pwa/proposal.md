## Why

This repository needs a minimal, runnable foundation for a personal flashcards app before adding product features or backend infrastructure. Starting with an installable mobile PWA shell keeps the first step small while preserving the intended mobile-first direction.

## What Changes

- Initialize a Next.js App Router application with TypeScript.
- Add Tailwind CSS and the default Next ESLint setup.
- Use npm as the package manager.
- Use a `src/` application structure and the default `@/*` import alias.
- Replace the starter page with a minimal "Hello world" flashcards landing screen.
- Add the minimum PWA assets and metadata required for mobile installation:
  - web app manifest
  - app name and short name: `Flashcards`
  - standalone display mode
  - start URL
  - theme/background colors
  - placeholder 192x192 and 512x512 icons
- Defer Service Worker, Serwist, offline behavior, Supabase, Auth, Drizzle, shadcn/ui, Lucide, and TanStack Query.

## Capabilities

### New Capabilities

- `app-shell`: Covers the minimal runnable application shell and visible initial page.
- `installable-pwa`: Covers the minimum installability metadata and icon assets for the app to be installed as a PWA.

### Modified Capabilities

None.

## Impact

- Creates the initial Next.js project files, npm lockfile, TypeScript config, Tailwind setup, ESLint config, and `src/app` routes.
- Adds public PWA assets under `public/`.
- No backend, database, authentication, API, or offline caching behavior is introduced in this change.
