# AutoCompare PK

React + FastAPI + PostgreSQL car comparison app (same stack as HomeCompare / Drive2Earn).

**Local:** frontend `http://localhost:9016` · API `http://localhost:9019` · Postgres `5437`

## Local

```bash
cd ~/financial-system/AutoCompare
docker compose up -d --build
```

Demo logins:

- Admin: `admin@autocompare.pk` / `admin123`
- User: `user@autocompare.pk` / `user123`

Request Info is public. Test Drive requires login and appears on the dashboard.

## Production (when asked)

Keep frontend on **9016** so existing Caddy (`autocompare.thecomparisonengine.com` → `127.0.0.1:9016`) still works. Stop the old static `autocompare_web` container first.
