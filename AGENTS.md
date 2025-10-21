# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds Next.js route segments. Dashboards live in `src/app/(dashboard)/`, while auth flows are under `src/app/(auth)/`.
- Shared UI primitives stay in `src/components/ui/`; domain services such as authentication live in `src/lib/`.
- Database schema and helpers are defined in `src/db/`, with the Drizzle config at the repository root (`drizzle.config.ts`).
- Static assets (icons, images) go in `public/`. Keep environment-specific values inside `.env` and never commit secrets.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server with Turbopack for local iteration.
- `npm run build` — create a production bundle; required before pushing deployment changes.
- `npm run lint` — run ESLint across the project; all PRs should pass.
- `npm run db:push` — apply Drizzle migrations to the configured database.
- `npm run db:studio` — open Drizzle Studio for inspecting and editing schema data.

## Coding Style & Naming Conventions
- Code is TypeScript-first with React Server/Client components. Use 2-space indentation and follow existing JSX formatting.
- Prefer descriptive camelCase for variables/functions and PascalCase for components (`AdminUsersPage`).
- Centralize repeated UI patterns in `src/components/ui/`; compose with Tailwind utility classes instead of inline styles.
- Rely on ESLint and Prettier-inferred rules (via `next lint`) to enforce formatting. Run `npm run lint` before committing.

## Testing Guidelines
- Automated tests are not yet established. When adding critical logic, provide lightweight runtime checks (e.g., integration calls) or document manual test steps in the PR description.
- Name future test files using `*.test.ts` under a colocated `__tests__` directory or alongside the module.

## Commit & Pull Request Guidelines
- Use concise imperative commit messages (e.g., `Add admin dialog form validation`). Group related changes into a single commit when possible.
- PRs should include: a summary of changes, testing evidence (command output or screenshots), and references to involved issues/epics.
- Request review before merging and ensure branches are up to date with `main`.

## Security & Configuration Tips
- Keep `.env` values scoped to least privilege. For Supabase, prefer service-role keys only in server contexts.
- Never check in generated SQLite databases or downloaded credentials; add them to `.gitignore` if new ones appear.
