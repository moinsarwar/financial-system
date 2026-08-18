# HomeCompare PK

Appliance comparison platform for Pakistan — compare specs, running costs (electric + gas), and filter by category.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 (CRA), nginx |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL 15 |

## Ports (monorepo)

| Service | Host port |
|---------|-----------|
| Frontend | **9015** |
| Backend API | **9014** |
| Postgres | **5435** |

## Quick start (WSL2 Docker)

```bash
cd ~/financial-system/appliance-comparison
cp -n .env.example .env
docker compose up -d --build
```

- App: http://localhost:9015
- API docs: http://localhost:9014/docs
- Health: http://localhost:9014/health

Database seeds automatically on first backend startup (~22 illustrative appliances).

## Dashboard (admin + user)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@homecompare.pk | admin123 |
| User | user@homecompare.pk | user123 |

- Login: `/login` · Dashboard: `/dashboard`
- **Admin** sees all inquiries & applications; can update application status
- **User** sees only their own submissions (when logged in)
- Public site forms (Request Info, Delivery, Services) save to DB without login

## Production (VPS)

Live: https://appliance-comparison.thecomparisonengine.com

```bash
ssh root@163.245.222.160 "cd /root/financial-system/appliance-comparison && docker compose up -d --build"
```

Caddy proxies `appliance-comparison.thecomparisonengine.com` → `127.0.0.1:9015` (nginx in frontend container proxies `/api` → backend).

## API

| Method | Path |
|--------|------|
| GET | `/api/appliances` — list (query: `category`, `search`, `filter_type`) |
| GET | `/api/appliances/{key}` |
| GET | `/api/comparison/{key_a}/{key_b}` |
| GET | `/api/costs/{key}` |
| GET | `/api/services` |
| POST | `/api/auth/login` |
| GET | `/api/auth/me` |
| POST | `/api/inquiries` |
| POST | `/api/applications` |
| PATCH | `/api/applications/{id}/status` (admin) |
| GET | `/api/dashboard/stats` |
| GET | `/api/dashboard/inquiries` |
| GET | `/api/dashboard/applications` |

## Local dev (no Docker)

```bash
# Backend
cd backend && pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5435/appliance_db
uvicorn app.main:app --reload --port 9014

# Frontend
cd frontend && npm install && npm start
```

Set `REACT_APP_API_URL=http://localhost:9014/api` in `frontend/.env` for local API calls.
