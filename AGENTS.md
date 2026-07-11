## Repository Structure

```text
.
├── docs/                # project documentation
│   └── adr/
├── drizzle/             # Drizzle migrations and metadata
│   └── meta/
├── openspec/            # OpenSpec changes and specifications
│   ├── changes/
│   └── specs/
├── public/              # static assets
├── scripts/             # local automation
├── src/                 # application source
│   ├── app/             # Next.js app router source
│   ├── brand/
│   ├── components/
│   ├── lib/
│   └── types/
└── supabase/            # local Supabase configuration
    ├── migrations/
    └── snippets/
```

## Repository Commands

- `npm run dev`: start the Next.js development server.
- `npm run build`: build the production app.
- `npm run check`: run the local quality checks.
- `npm run db:generate`: generate Drizzle migrations.
- `npm run db:migrate`: run Drizzle migrations.
- `npm run supabase:start`: start local Supabase services.
- `npm run supabase:stop`: stop local Supabase services.
- `npm run db:check`: validate Drizzle schema consistency.
- `npm run test`: run the Vitest test suite.
- `npm run deploy`: deploy to production.

## Configuration and Debugging

- Use the repo-local CLIs through `npx supabase ...` and `npx vercel ...`.

## Design Context

- Product strategy lives in `PRODUCT.md`; default register is `product`.
- Visual system lives in `DESIGN.md`; follow “The Quiet Study Desk”: restrained, mobile-first, calm, and non-gamified.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
