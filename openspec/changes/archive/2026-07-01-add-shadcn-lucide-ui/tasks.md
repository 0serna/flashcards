## 1. Setup

- [x] 1.1 Add shadcn/ui configuration for Tailwind CSS v4 with `new-york`, `neutral`, React Server Components, TypeScript, source aliases, and Lucide icons.
- [x] 1.2 Add required dependencies for shadcn UI primitives, Tailwind class merging, and Lucide React icons.
- [x] 1.3 Add the shared `cn()` utility under the configured library alias.

## 2. Theme Foundation

- [x] 2.1 Update global CSS with shadcn-compatible theme tokens and Tailwind v4 theme mapping.
- [x] 2.2 Update the root layout styling to use shadcn background and foreground tokens.

## 3. UI Components

- [x] 3.1 Add local shadcn-style `Button`, `Input`, and `Label` components under the shared UI component alias.
- [x] 3.2 Ensure the components support additional class names through the shared class composition utility.

## 4. Login Integration

- [x] 4.1 Update the passwordless login form to render its email label, email input, and submit button with the shared UI components.
- [x] 4.2 Preserve existing form field names, server action wiring, validation messages, success state, and error state behavior.

## 5. Verification

- [x] 5.1 Add or update tests that verify the login form still exposes the expected email field, submit behavior, and messages after the component migration.
- [x] 5.2 Run the repository quality checks and fix any lint, typecheck, build, or test failures.
