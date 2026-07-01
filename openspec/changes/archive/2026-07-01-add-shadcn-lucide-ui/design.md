## Context

The application is a Next.js App Router project with TypeScript and Tailwind CSS v4. The current UI is intentionally small and uses hand-written Tailwind classes in the app layout, root page, and login form. `stack.md` identifies shadcn/ui and Lucide Icons as intended UI stack items that are not yet integrated.

This change introduces the shared UI foundation before the product UI grows, minimizing migration cost and creating a consistent path for future screens.

## Goals / Non-Goals

**Goals:**

- Configure shadcn/ui for the existing Next.js, TypeScript, Tailwind v4 project.
- Use the `new-york` style, `neutral` base color, CSS variables, and Lucide icon library.
- Add the minimal local UI primitives needed by the current login form: button, input, and label.
- Add the shared `cn()` utility expected by shadcn components.
- Align global styling and root layout with shadcn theme tokens.
- Preserve the existing authentication behavior and route contracts.

**Non-Goals:**

- Redesign the full application experience.
- Add React Hook Form, TanStack Query, database persistence, or new auth flows.
- Introduce custom design-system abstractions beyond shadcn's generated local components.
- Add broad component coverage before the app needs it.

## Decisions

- Use shadcn/ui local components instead of a packaged component library.
  - Rationale: shadcn components are copied into the repository, making them easy to customize while keeping dependencies explicit.
  - Alternative considered: keep only hand-written Tailwind classes. Rejected because it does not establish the intended shared UI baseline from `stack.md`.

- Use Tailwind v4 CSS-token setup without adding a Tailwind config file.
  - Rationale: the project already uses Tailwind v4 and shadcn supports v4 with CSS variables and an empty config path in `components.json`.
  - Alternative considered: add a Tailwind config for shadcn. Rejected because it adds unnecessary configuration for Tailwind v4.

- Use `new-york` style with `neutral` base color.
  - Rationale: this combination is compact, sober, and close to the current grayscale visual direction.
  - Alternative considered: `default` style or `zinc` base color. Rejected to keep the UI less generic and avoid a colder gray palette.

- Validate adoption by migrating login controls only.
  - Rationale: the login form is the only meaningful interactive UI currently present, and migrating `Button`, `Input`, and `Label` proves the setup without a full redesign.
  - Alternative considered: configure shadcn without touching existing UI. Rejected because it would not validate the components in real app code.

- Use Lucide through `lucide-react` and shadcn's `iconLibrary` setting.
  - Rationale: this supports both generated shadcn components and direct app icon imports.
  - Alternative considered: inline SVGs. Rejected because Lucide is already part of the intended stack and provides consistent icons.

## Risks / Trade-offs

- Global CSS token changes may slightly alter colors or default rendering → Keep the change limited to shadcn's standard token foundation and verify existing pages still render correctly.
- Generated components can add dependencies over time → Add only components needed by current UI.
- Login visual changes could be mistaken for auth behavior changes → Keep server actions, validation, field names, and routes unchanged.
- Future theme choices may evolve → Because shadcn components are local files, tokens and component styles can be adjusted later without replacing the foundation.
