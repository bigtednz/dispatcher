# Dispatcher – To-do list

Use this list to track setup and next steps. Check off items as you go.

---

## Railway deployment (GitHub connected)

- [ ] **Create a new Railway project** (or use existing one).
- [ ] **Add Postgres** – Railway dashboard → New → Database → PostgreSQL. Copy `DATABASE_URL`.
- [ ] **Add Redis** – New → Database → Redis. Copy `REDIS_URL`.
- [ ] **Add API service**
  - New → GitHub Repo → select `bigtednz/dispatcher`.
  - **Root directory:** leave blank (repo root).
  - **Build:** `pnpm install && pnpm --filter api build`
  - **Start:** `pnpm --filter api start:prod`
  - **Variables:** `DATABASE_URL` (from Postgres), `REDIS_URL` (from Redis), `JWT_SECRET` (min 32 chars), `WEB_ORIGIN` = your web app URL (e.g. `https://your-web.up.railway.app`).
  - **Migrations:** After first deploy, run once (Railway CLI or one-off):  
    `pnpm --filter api exec prisma migrate deploy`  
    Or add a deploy script that runs it before start.
- [ ] **Add Web service**
  - New → GitHub Repo → same repo `bigtednz/dispatcher`.
  - **Root directory:** leave blank.
  - **Build:** `pnpm install && pnpm --filter web build`
  - **Start:** `pnpm --filter web start`
  - **Variable:** `NEXT_PUBLIC_API_URL` = your API URL (e.g. `https://your-api.up.railway.app/api`).
- [ ] **Wire URLs** – Set API’s `WEB_ORIGIN` to the Web service URL; set Web’s `NEXT_PUBLIC_API_URL` to the API service URL (with `/api`).
- [ ] **Deploy and test** – Push to `main` or trigger deploy; open Web URL, log in (seed prod if needed).

---

## If the API crashes on Railway

1. **View logs** – Railway project → API service → **Deployments** → click latest → **View logs** (or **Logs** tab). Look for `[Startup] Missing env:` or `[Startup] Fatal:` and the error below.
2. **Env vars** – In the API service, **Variables** must include:
   - `DATABASE_URL` (from Railway Postgres – use **Variables** → **Reference** from the Postgres service if needed).
   - `REDIS_URL` (from Railway Redis – same, reference the Redis service).
   - `JWT_SECRET` (any string ≥ 32 characters).
   - `WEB_ORIGIN` (your Web app URL, e.g. `https://your-app.up.railway.app`).
3. **Migrations** – The API now runs `prisma migrate deploy` before starting. If the DB is empty or schema is wrong, the deploy will fail; logs will show the Prisma error.
4. **Postgres/Redis** – Ensure the Postgres and Redis services are in the same project and **running**. The API needs both to start.

---

## After deploy

- [ ] **Seed production DB** (if empty) – e.g. run `pnpm db:seed` via Railway CLI/one-off, or call `POST /api/simulation/seed-waikato` and `POST /api/rules/seed-default` (admin).
- [ ] **Change default admin password** – default is `admin1234`; change in app or DB for production.

---

## Repo / dev polish (optional)

- [ ] **Ignore build artifacts** – Add to `.gitignore`: e.g. `apps/api/prisma/*.js`, `packages/shared/src/*.js` (and `.map`/`.d.ts` if desired) so compiled outputs aren’t committed.
- [ ] **Run tests** – `pnpm test` (and fix any failures).
- [ ] **CI** – Add a GitHub Action to run `pnpm install && pnpm test` on push/PR.

---

## Ideas for later

- [ ] More brigades / areas in seed data.
- [ ] Rules engine tweaks or new rulesets.
- [ ] After Action Review (AAR) flow or UI improvements.
- [ ] Map/dashboard UX (MapLibre, filters, etc.).

---

*Edit this file and check off items as you complete them.*
