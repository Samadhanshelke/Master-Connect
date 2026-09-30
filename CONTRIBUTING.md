# Contributing

Thanks for helping with Master Connect. Follow [AGENT.md](./AGENT.md) for architecture rules. This file is the human workflow.

## Prerequisites

- Node.js 20+
- npm 10+ (this repo uses npm workspaces)

## First-time setup

1. Clone the repo and install from the **root** (not from a nested app):

   ```bash
   npm install
   ```

2. Copy env files:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

3. Create the database and seed an admin user:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Default local admin (SQLite seed):

   - Email: `admin@masterconnect.local`
   - Password: `admin123`

4. Start the API, then the UI you need:

   ```bash
   npm run dev:api      # http://localhost:4000
   npm run dev:web      # http://localhost:3000
   npm run dev:admin    # http://localhost:3001
   npm run dev:mobile   # Expo
   ```

## Workspaces

| Package | Path | Port |
| --- | --- | --- |
| `@master-connect/api` | `apps/api` | 4000 |
| `@master-connect/web` | `apps/web` | 3000 |
| `@master-connect/admin` | `apps/admin` | 3001 |
| `master-connect` (mobile) | `apps/mobile` | Expo |
| `@master-connect/shared` | `packages/shared` | — |

Run a script in one workspace:

```bash
npm run start:dev -w @master-connect/api
```

## Branch and PR habits

- Branch from `main`: `feat/...`, `fix/...`, `chore/...`.
- Keep PRs small: one domain when possible (for example posts API + web feed, not posts + chat + banners).
- Update `packages/shared` in the same PR when you change a public API shape.
- Do not commit `node_modules`, `.env`, `dev.db`, or Firebase service accounts.

## Coding standards

- TypeScript throughout. Avoid `any`.
- Nest: modules + DTOs + guards as in AGENT.md.
- React: function components. Keep server secrets out of client bundles (`NEXT_PUBLIC_` / `EXPO_PUBLIC_` only for non-secrets).
- Format with the project ESLint configs before you open a PR.

## Testing a change

Minimum checks:

1. API starts and `/health` returns `{ "ok": true }`.
2. Admin can sign in with the seed user and load Overview.
3. If you touched a mutation, prove create + list + delete (or the equivalent status change).
4. If you touched web UI, walk the flow in the browser (login, page, submit).

## Adding an endpoint

1. Prisma model if persistence changes (`apps/api/prisma/schema.prisma`).
2. Migrate: `npm run db:migrate`.
3. DTO + service + controller in the matching Nest module.
4. Export types / path helpers from `packages/shared`.
5. Call it from web, admin, and/or mobile — never only from a one-off script unless it is a seed.

## Questions

If a change would reintroduce Firestore as the write path, or add a second backend, stop and follow AGENT.md instead.
