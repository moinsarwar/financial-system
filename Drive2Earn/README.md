# Drive to Earn

Vehicle access prototype — React + FastAPI + PostgreSQL + Docker.

## Ports

| Service | Host port |
|---------|-----------|
| Frontend | **9017** |
| Backend API | **9018** |
| Postgres | **5436** |

## Local (WSL2 Docker)

```bash
cd ~/financial-system/Drive2Earn
docker compose up -d --build
```

- Site: http://localhost:9017
- Login: http://localhost:9017/login
- Dashboard: http://localhost:9017/dashboard
- API docs: http://localhost:9018/docs

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@drive2earn.pk | admin123 |
| Driver | driver@drive2earn.pk | driver123 |

**Admin** sees all applications and estimates, can change status.  
**Driver** sees only their own records.

## What works

1. Public site: vehicles from DB, calculator, affordability estimate (saved to Postgres)
2. Sign in / register
3. **Apply** for a vehicle (login required) — stored as an application
4. Dashboard: applications + estimates, admin follow-up statuses

## Production (VPS)

Live: https://drive-to-earn.thecomparisonengine.com

Caddy: `drive-to-earn.thecomparisonengine.com` → `127.0.0.1:9017` (frontend nginx proxies `/api` → backend).

```bash
ssh root@163.245.222.160 "cd /root/financial-system && git pull origin main && cd Drive2Earn && docker compose up -d --build"
```

## API

| Method | Path |
|--------|------|
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| GET | `/api/auth/me` |
| GET | `/api/vehicles/` |
| POST | `/api/affordability/` |
| POST | `/api/applications/` |
| GET | `/api/dashboard/stats` |
| GET | `/api/dashboard/applications` |
| GET | `/api/dashboard/estimates` |
