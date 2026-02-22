# Fire Dispatch Simulator

Production-ready monorepo for an NZ-based fire dispatch simulator (single-player v1), centred on Morrinsville (Waikato) with surrounding brigades and towns. CAD-style, data-driven rules engine, realtime updates, and After Action Review.

## Stack

- **Monorepo:** pnpm workspaces
- **Web:** Next.js 14 (TypeScript), App Router, Tailwind, MapLibre GL JS
- **API:** NestJS (TypeScript)
- **ORM:** Prisma
- **DB:** PostgreSQL (Railway)
- **Realtime:** Socket.IO (WebSockets)
- **Jobs/timers:** BullMQ + Redis (Railway)
- **Validation:** Zod (web) + class-validator/class-transformer (API)
- **Testing:** Vitest, Supertest (API e2e)
- **Auth:** JWT (email/password, argon2)

## Local development

### Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- PostgreSQL 14+ (local or Docker)
- Redis (local or Docker)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment

Copy env examples and set values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env`: set `DATABASE_URL` (e.g. `postgresql://postgres:postgres@localhost:5432/dispatcher`) and optionally `REDIS_URL` (defaults to localhost:6379).

### 3. Database

```bash
pnpm db:migrate:dev
pnpm db:seed
```

Or with existing DB:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Run dev (web + API in parallel)

```bash
pnpm dev
```

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

### Optional: Postgres + Redis via Docker

```bash
docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dispatcher postgres:16-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

## Railway deployment

### Services

1. **Postgres** – add PostgreSQL plugin; note `DATABASE_URL`.
2. **Redis** – add Redis plugin; note `REDIS_URL`.
3. **API** – from repo root:
   - **Build command:** `pnpm install && pnpm --filter api build`
   - **Start command:** `pnpm --filter api start:prod`
   - **Root directory:** (leave blank or set to repo root)
   - Run migrations on deploy: add a deploy step or use Railway’s “Deploy” hook to run `pnpm --filter api exec prisma migrate deploy` (e.g. in a separate one-off job or in start script before starting the server).
4. **Web** – from repo root:
   - **Build command:** `pnpm install && pnpm --filter web build`
   - **Start command:** `pnpm --filter web start`
   - Set `NEXT_PUBLIC_API_URL` to the API service URL.

### Procfile-style commands (for reference)

- **web:** `pnpm --filter web start`
- **api:** `pnpm --filter api start:prod`

### Env (production)

- `NODE_ENV=production`
- `DATABASE_URL` (from Postgres)
- `REDIS_URL` (from Redis)
- `JWT_SECRET` (min 32 chars, secret)
- `WEB_ORIGIN` (front-end origin for CORS and Socket.IO)

Run `prisma migrate deploy` before or during API startup (e.g. in a release phase or start script).

## Seed data

Waikato bootstrap is **placeholder approximations** (not authoritative FENZ data). Locations: Morrinsville, Hamilton, Te Aroha, Matamata, Cambridge, Te Awamutu, Huntly, Raglan. Seed runs via:

- `pnpm db:seed` (Prisma seed), or
- API (admin): `POST /simulation/seed-waikato`

Default rules are seeded with `POST /rules/seed-default` (admin) or as part of `pnpm db:seed`.

## Scripts

| Command | Description |
|--------|-------------|
| `pnpm dev` | Run web + API in parallel |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests (web + API) |
| `pnpm db:migrate:dev` | Create and apply migrations (dev) |
| `pnpm db:migrate` | Apply migrations (prod) |
| `pnpm db:seed` | Seed DB (Waikato + default rules + admin user) |
| `pnpm db:studio` | Open Prisma Studio |

## Default admin

After seed: **admin@dispatcher.local** / **admin1234** (change in production).

## Observability

- Structured logging: use a logger (e.g. `Logger` from NestJS) in the API; no proprietary format.
- Health: `GET /health` (live), `GET /health/ready` (DB check).
- Optional: add Sentry (or similar) in the API and web by installing `@sentry/node` / `@sentry/nextjs` and initialising in `main.ts` and `next.config.js`; leave placeholders if not used.

## First run checklist

1. **pnpm install** at repo root.
2. **Copy env:** `apps/api/.env` and `apps/web/.env.local` from `.env.example` files.
3. **Set DATABASE_URL** in `apps/api/.env` (e.g. `postgresql://postgres:postgres@localhost:5432/dispatcher`).
4. **Start Postgres and Redis** (local or Docker).
5. **pnpm db:migrate:dev** then **pnpm db:seed**.
6. **pnpm dev** – open http://localhost:3000, log in with **admin@dispatcher.local** / **admin1234**, go to Dashboard.
7. (Admin) **Seed Waikato** and **Seed default rules** if not already done via db:seed – use API or run seed once.
8. (Admin) **Start shift** on the dashboard to run the simulation tick loop.

**Windows (PowerShell):** see [First run on Windows](docs/FIRST-RUN-WINDOWS.md) for exact commands.

## Three most likely local setup issues

1. **Database connection refused**  
   Ensure PostgreSQL is running and `DATABASE_URL` in `apps/api/.env` is correct (host, port, user, password, database name). Use `pnpm db:migrate:dev` to apply migrations; if it fails, fix the URL or start Postgres.

2. **Redis connection refused**  
   BullMQ and Socket.IO may need Redis. Start Redis (e.g. `docker run -d -p 6379:6379 redis:7-alpine`) or set `REDIS_URL` in `apps/api/.env`. If Redis is down, the API may fail to start or jobs won’t run.

3. **CORS or Socket.IO connection failed**  
   If the web app can’t call the API or connect over WebSockets, set `WEB_ORIGIN` in `apps/api/.env` to `http://localhost:3000` and `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` to `http://localhost:4000`. Use the same origin/URL when using a different host/port.

## Connect to GitHub

1. **Initialise git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: fire dispatch simulator monorepo"
   ```

2. **Create a new repository** on GitHub (e.g. `your-username/dispatcher`) – do *not* add a README or .gitignore if the repo already has them.

3. **Add the remote and push** (replace with your repo URL):
   ```bash
   git remote add origin https://github.com/your-username/dispatcher.git
   git branch -M main
   git push -u origin main
   ```

   Or with SSH:
   ```bash
   git remote add origin git@github.com:your-username/dispatcher.git
   git branch -M main
   git push -u origin main
   ```

4. **Keep `.env` and `.env.local` out of the repo** – they are in `.gitignore`; never commit secrets.

## Documentation

- [Rules Engine](docs/RULES-ENGINE.md) – versioned rulesets and how to edit rules in the DB.
- [First run on Windows](docs/FIRST-RUN-WINDOWS.md) – exact PowerShell commands for local setup.
