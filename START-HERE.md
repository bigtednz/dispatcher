# Start here – simple steps

Do these in order. If something fails, check the note at the bottom.

---

## Part A: Run the app on your computer

### 1. Open a terminal in the project folder

- In VS Code / Cursor: **Terminal → New Terminal** (or press `` Ctrl+` ``).
- Or open PowerShell and run: `cd D:\Cursor\Dispatcher`

### 2. Install pnpm (if you don’t have it)

If `pnpm` is not recognized, run once:

```powershell
npm install -g pnpm
```

Then close and reopen the terminal (or open a new one).

### 3. Install dependencies

```powershell
pnpm install
```

Wait until it finishes.

### 4. Copy the env files

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
```

### 5. Start Postgres and Redis

**Option A – You already have Postgres on this PC (e.g. port 5432 in use)**  
- Use it. Create a database named `dispatcher` (in pgAdmin, or run: `psql -U postgres -c "CREATE DATABASE dispatcher;"`).  
- In `apps\api\.env` set `DATABASE_URL` to match your Postgres (e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/dispatcher`).  
- For Redis: if you have it, leave `REDIS_URL` as is. If not, start only Redis with Docker:  
  `docker run -d --name redis -p 6379:6379 redis:7-alpine`

**Option B – Use Docker for both**  
Only if port 5432 is free. If you see “port is already allocated”, use Option A for Postgres.

```powershell
docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dispatcher postgres:16-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 6. Set up the database

```powershell
pnpm db:migrate:dev
```

If it asks for a migration name, type `init` and press Enter.

Then run:

```powershell
pnpm db:seed
```

### 7. Start the app (both API and web must run)

```powershell
pnpm dev
```

This starts **both** the API (port 4000) and the web app (port 3003). **Login will only work if both are running.**

**Wait until you see** in the terminal:
- Something like `API listening on http://localhost:4000/api` (API)
- And `Ready in 3s` / `Local: http://localhost:3003` (web)

Then open a browser and go to:

- **http://localhost:3003**  
  or, if that doesn’t load, try **http://127.0.0.1:3003**
- Click **Log in**
- Email: **admin@dispatcher.local**
- Password: **admin1234**
- Click **Dashboard**

You’re done with Part A.

---

### If the API “can’t be reached” when you log in

1. **Start only the API** in a terminal:
   ```powershell
   cd D:\Cursor\Dispatcher
   pnpm dev:api
   ```
2. **Wait** until you see: `API listening on http://localhost:4000/api` (and no red errors).
3. **Test in the browser:** open **http://localhost:4000/api/health**  
   You should see: `{"status":"ok","timestamp":"..."}`  
   If that page doesn’t load, the API isn’t running – look at the same terminal for errors (e.g. Redis, database, port 4000 in use).
4. **Then start the full app** in a *second* terminal:
   ```powershell
   cd D:\Cursor\Dispatcher
   pnpm dev
   ```
   Or keep the first terminal running the API and run `pnpm dev:web` in the second so the web app runs on 3003. Then open **http://localhost:3003** and try logging in again.

---

## Part B: Put the project on GitHub

### 1. Create a new repo on GitHub

- Go to: **https://github.com/new**
- **Repository name:** e.g. `dispatcher`
- Leave **“Add a README”** and **“.gitignore”** **unchecked**
- Click **Create repository**

### 2. Connect your folder to GitHub and push

In your project folder, run these two commands. **Change `YOUR_USERNAME` and `dispatcher`** to your GitHub username and repo name.

```powershell
git remote add origin https://github.com/YOUR_USERNAME/dispatcher.git
git push -u origin main
```

Example: if your GitHub username is `janesmith` and the repo is `dispatcher`:

```powershell
git remote add origin https://github.com/janesmith/dispatcher.git
git push -u origin main
```

When it asks for your GitHub login, sign in. After that, your code is on GitHub.

---

## If something goes wrong

| Problem | What to do |
|--------|------------|
| **“pnpm not found”** | Install Node.js from https://nodejs.org, then run: `npm install -g pnpm` |
| **Port in use / page won’t load** | The app uses port **3003**. If that’s busy, edit `apps\web\package.json`: change `--port 3003` to e.g. `--port 3004`. Then set `WEB_ORIGIN` in `apps\api\.env` to the same (e.g. `http://localhost:3004`) and open that URL in the browser. |
| **“3003 not working” / blank or can’t connect** | (1) Run `pnpm dev` and wait until you see **“Ready”** and **“Local: http://localhost:3003”**. (2) Try **http://127.0.0.1:3003** instead of localhost. (3) Try a different browser or incognito. (4) If you only need the web app to test, run `pnpm dev:web` and open http://localhost:3003. |
| **“Failed to fetch” / “Cannot reach the API” on login** | The **API** (port 4000) isn’t running or isn’t reachable. Run **`pnpm dev`** and watch the terminal: you must see “API listening on http://localhost:4000/api”. If instead you see a **compile error** (e.g. in `prisma/waikato-seed.data.ts`) or a **Redis/DB error**, fix that first so the API can start. |
| **“Can’t be reached” / API or site won’t load** | **API:** In a terminal run `pnpm dev:api` and wait for “API listening on http://localhost:4000/api”. If that never appears, check for red errors (e.g. Redis, database). Open **http://localhost:4000/api/health** in the browser – you must see `{"status":"ok"}`. **Web:** Run `pnpm dev:web` and wait for “Local: http://localhost:3003”. Open **http://localhost:3003** or **http://127.0.0.1:3003**. If one of these URLs never loads, that service isn’t running. |
| **Nothing loads / blank page** | Hard refresh (Ctrl+Shift+R). If you’re on /dashboard without being logged in, you should see “Redirecting to login…” then the login page. Open **http://localhost:3003** (or **http://127.0.0.1:3003**) and try **http://localhost:3003** first (home page with “Log in” button). |
| **404 on login** | The app now calls **http://localhost:4000/api**. Restart both API and web (`pnpm dev`). Ensure `apps\web\.env.local` has `NEXT_PUBLIC_API_URL="http://localhost:4000/api"`. If 404 persists, open **http://localhost:4000/api/health** in the browser – you should see `{"status":"ok"}`. If not, the API isn’t running or something else is on port 4000. |
| **“Database” or “connection refused”** | Make sure Postgres is running (e.g. Docker container `postgres` is running). |
| **“Authentication failed” (P1000)** | The username or password in `apps\api\.env` (inside `DATABASE_URL`) is wrong. Use the same user and password you use to open Postgres (e.g. in pgAdmin). Format: `postgresql://USER:PASSWORD@localhost:5432/dispatcher?schema=public` |
| **“Redis” error** | Make sure Redis is running (e.g. Docker container `redis` is running). |
| **“remote origin already exists”** | You already added GitHub. Just run: `git push -u origin main` |
| **Push asks for login** | Use your GitHub username and a **Personal Access Token** (not your normal password). Create one at: GitHub → Settings → Developer settings → Personal access tokens. |

If you’re stuck, say which step number you’re on and the exact error message.
