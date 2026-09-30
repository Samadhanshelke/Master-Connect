# Master Connect

Monorepo for the city community platform.

| App | Path | Dev command |
| --- | --- | --- |
| NestJS API | `apps/api` | `npm run dev:api` |
| Next.js web | `apps/web` | `npm run dev:web` |
| Admin panel | `apps/admin` | `npm run dev:admin` |
| Expo mobile | `apps/mobile` | `npm run dev:mobile` |

Read [AGENT.md](./AGENT.md) before changing architecture and [CONTRIBUTING.md](./CONTRIBUTING.md) for setup.

The API is the system of record. Web, admin, and mobile call it over REST. Do not add Firestore or Firebase clients.

Local admin after `npm run db:seed`: `admin@masterconnect.local` / `admin123`.
