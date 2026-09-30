# AGENT.md

Rules for humans and coding agents working in this repository. Read this file before changing code.

## Product

Master Connect is a city-scoped community platform: local/global feed, shops, jobs, city chat, banners, news, and an admin console.

## Monorepo layout

```
apps/api       NestJS HTTP API (system of record)
apps/web       Next.js public web app
apps/admin     Next.js admin panel
apps/mobile    Expo (React Native) mobile app
packages/shared  Shared TypeScript types and API path helpers
```

All work lives under `apps/` and `packages/`.

## Source of truth

- **PostgreSQL/SQLite via Prisma in `apps/api` is the backend.** Do not add Firestore, Firebase Auth, or Next.js Route Handlers that mutate domain data.
- Clients talk to Nest over REST (`Authorization: Bearer <jwt>`). Email and password auth issues that JWT.
- News articles may be proxied from a third-party news API through Nest. Do not call news keys from the browser or mobile client.

## App responsibilities

| App | Allowed | Forbidden |
| --- | --- | --- |
| `apps/api` | Auth, authorization, validation, persistence, admin actions, side effects | UI |
| `apps/web` | Citizen/shop-owner UX | Privileged admin mutations |
| `apps/admin` | Admin-only UX (roles, reports, banner approve, city CRUD) | Bypassing Nest guards |
| `apps/mobile` | Same domain as web | Direct privileged writes |

## NestJS conventions

- One domain per module: `auth`, `users`, `cities`, `posts`, `shops`, `jobs`, `banners`, `chat`, `reports`, `notifications`, `news`.
- Controllers stay thin. Business rules live in services.
- Use class-validator DTOs on every write endpoint.
- `@Roles('admin')` for admin routes. Resource owners may mutate their own shops, jobs, posts, and banners.
- Return JSON `{ error: string }` on failure with the correct HTTP status.
- Prisma goes through `PrismaService`. Do not instantiate `PrismaClient` in feature modules.
- City create also creates the city group chat room (`group:<slug>`).

## Client conventions

- Use `@master-connect/shared` types where possible.
- Call Nest via a small API helper; do not scatter `fetch` URLs.
- List screens poll or refetch after mutations.
- Web and admin are App Router + TypeScript. Mobile is Expo Router + TypeScript.
- Brand color: `#009688`. Admin chrome: `#0f2f2c`.

## Types and roles

- Roles: `citizen` | `shop_owner` | `admin`.
- Post visibility: `local` | `global`. Local posts are filtered by the user's city.
- Banner status: `pending` | `approved` | `rejected`. Payment: `unpaid` | `paid`.
- Job status: `active` | `closed`.

## Security

- Never commit `.env`, service account JSON, or private keys.
- Never log tokens or passwords.
- Do not weaken `RolesGuard` or skip auth “for convenience” on write routes.
- Seed credentials are local-only; change them before any shared deployment.

## Change policy

- Prefer editing existing modules over new parallel stacks.
- Keep changes scoped. Do not drive-by refactor unrelated apps.
- After UI changes, verify the affected flow (login, list, create, delete) in the browser when tools are available.
- After API changes, keep Prisma schema, DTOs, and `packages/shared` in sync.

## Commands (from repo root)

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
npm run dev:admin
npm run dev:mobile
```
