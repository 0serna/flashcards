## Repository Structure

```text
.
├── openspec/            # OpenSpec changes and specifications
│   ├── changes/
│   └── specs/
├── public/              # static assets
├── scripts/             # local automation
└── src/
    └── app/             # Next.js app router source
```

## Repository Commands

- `npm run dev`: start the Next.js development server.
- `npm run build`: build the production app.
- `npm run start`: start the production server.
- `npm run lint`: run ESLint.
- `npm run check`: run the local quality checks.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run format`: format repository files with Prettier.
- `npm run test`: run the Vitest test suite.

## Workflow

- Always use the `TDD` skill when implementing new features or fixing bugs/issues.

## Design Context

- Product strategy lives in `PRODUCT.md`; default register is `product`.
- Visual system lives in `DESIGN.md`; follow “The Quiet Study Desk”: restrained, mobile-first, calm, and non-gamified.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
