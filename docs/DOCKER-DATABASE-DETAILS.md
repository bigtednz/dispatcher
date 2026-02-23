# Where to find database details in Docker

## If Postgres is running in a Docker container

### 1. See your containers

```powershell
docker ps
```

Look for a container running postgres (name might be `postgres` or similar). Note the **container name** or **ID**.

### 2. See the env vars (username, password, db name)

```powershell
docker inspect postgres
```

(Replace `postgres` with your container name from step 1.)

In the long output, find the **"Env"** section. You’ll see lines like:

- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=dispatcher`

Those are the values you use in `DATABASE_URL`:

- **Username** = value of `POSTGRES_USER`
- **Password** = value of `POSTGRES_PASSWORD`
- **Database** = value of `POSTGRES_DB`

### 3. See which port is mapped

In the same `docker inspect postgres` output, find **"PortBindings"** under **"NetworkSettings"**. You’ll see something like:

- `"5432/tcp": [{"HostPort": "5432"}]` → port is **5432**

If the HostPort is different (e.g. `5433`), use that in your URL.

### 4. Build your DATABASE_URL

Format:

```
postgresql://USER:PASSWORD@localhost:PORT/DATABASE?schema=public
```

Example (from the env vars above):

```
postgresql://postgres:postgres@localhost:5432/dispatcher?schema=public
```

Put that in `apps/api/.env` as:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dispatcher?schema=public"
```

---

## Shortcut: only show env vars

```powershell
docker inspect postgres --format '{{range .Config.Env}}{{println .}}{{end}}'
```

This prints only the env lines (e.g. `POSTGRES_USER=postgres`), so you can quickly see user, password, and db.
