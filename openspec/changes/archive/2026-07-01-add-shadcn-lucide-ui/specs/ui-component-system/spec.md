## ADDED Requirements

### Requirement: shadcn UI foundation

The system SHALL provide a local shadcn/ui component foundation configured for the existing Next.js, TypeScript, and Tailwind CSS v4 application.

#### Scenario: Project exposes shadcn configuration

- **WHEN** a developer inspects the UI configuration
- **THEN** the system SHALL define shadcn settings for React Server Components, TypeScript, Tailwind CSS v4, `new-york` style, `neutral` base color, CSS variables, and the `@/*` source aliases

#### Scenario: Project uses shadcn theme tokens

- **WHEN** the application renders global styles
- **THEN** the system SHALL expose shadcn-compatible theme tokens for background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, card, and popover colors

### Requirement: Shared UI primitives

The system SHALL provide local reusable UI primitives for the current login controls.

#### Scenario: Login primitive components are available

- **WHEN** application code imports shared UI primitives
- **THEN** the system SHALL provide button, input, and label components under the shared UI component alias

#### Scenario: Components support class composition

- **WHEN** shared UI components receive additional class names
- **THEN** the system SHALL merge those class names through a shared utility compatible with Tailwind class conflict resolution

### Requirement: Lucide icon availability

The system SHALL make Lucide icons available for application UI and shadcn-generated components.

#### Scenario: Application imports an icon

- **WHEN** application code imports an icon from the Lucide React package
- **THEN** the system SHALL provide the icon as a React component that can be styled with Tailwind classes

#### Scenario: shadcn configuration references icons

- **WHEN** shadcn tooling reads the project configuration
- **THEN** the system SHALL identify Lucide as the configured icon library
