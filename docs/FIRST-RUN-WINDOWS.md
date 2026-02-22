# First run on Windows (PowerShell)

Use these commands in order. Run PowerShell as needed (no need for Admin unless you install tools system-wide).

## 1. Prerequisites

- **Node.js 20+** – [nodejs.org](https://nodejs.org) or `winget install OpenJS.NodeJS.LTS`
- **pnpm** – `npm install -g pnpm`
- **Docker Desktop** (optional) – for Postgres and Redis: [docker.com](https://www.docker.com/products/docker-desktop/)

If you don’t use Docker, install **PostgreSQL** and **Redis** (e.g. via Chocolatey, Scoop, or installers) and ensure they’re running.

## 2. Clone or open the repo

```powershell
cd D:\Cursor\Dispatcher
```

(Or your actual path after cloning from GitHub.)

## 3. Install dependencies

```powershell
pnpm install
```

## 4. Start Postgres and Redis (Docker)

If using Docker Desktop:

```powershell
docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dispatcher postgres:16-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

If you already have containers:

```powershell
docker start postgres redis
```

## 5. Environment files

**PowerShell (no `cp`):**

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
```

Edit **`apps\api\.env`** and set at least:

- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dispatcher?schema=public"`
- Leave `REDIS_URL="redis://localhost:6379"` if Redis is on localhost.

Edit **`apps\web\.env.local`** (optional if defaults are fine):

- `NEXT_PUBLIC_API_URL="http://localhost:4000"`

## 6. Database: migrate and seed

```powershell
pnpm db:migrate:dev
```

When prompted for a migration name, you can use `init` or press Enter.

Then:

```powershell
pnpm db:seed
```

## 7. Run the app

```powershell
pnpm dev
```

- Web: **http://localhost:3000**
- API: **http://localhost:4000**

## 8. Log in

- Open http://localhost:3000
- **Log in** → use **admin@dispatcher.local** / **admin1234** (from seed)
- Open **Dashboard**, then (as admin) **Start shift** to run the simulation tick.

## Optional: seed via API

If you didn’t run `pnpm db:seed` or want to re-seed Waikato and rules:

1. Log in as admin (or create an admin user and log in).
2. Call the API with your JWT:
   - **Seed Waikato:** `POST http://localhost:4000/simulation/seed-waikato` with header `Authorization: Bearer <token>`
   - **Seed default rules:** `POST http://localhost:4000/rules/seed-default` with same header.

You can use the browser Network tab after logging in to copy your token, or use a REST client (e.g. Thunder Client, Postman).

## Troubleshooting

| Issue | Fix |
|--------|-----|
| `Database connection refused` | Start Postgres; check `DATABASE_URL` in `apps\api\.env` (host, port, user, password, DB name). |
| `Redis connection refused` | Start Redis (e.g. `docker start redis`); check `REDIS_URL` in `apps\api\.env`. |
| `pnpm db:migrate:dev` fails | Ensure Postgres is running and the database `dispatcher` exists (Docker command above creates it). |
| CORS / can’t reach API from browser | Set `WEB_ORIGIN=http://localhost:3000` in `apps\api\.env` and `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps\web\.env.local`. |
