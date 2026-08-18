# HomeCompare PK

Appliance comparison for Pakistan: specs, **running costs** (electric + gas), manufacturer filters, and a lead-gen dashboard for inquiries and service applications.

Live: [appliance-comparison.thecomparisonengine.com](https://appliance-comparison.thecomparisonengine.com)

## Who this targets

**Households in Pakistan** choosing an AC, fridge, washer, or similar — especially people who care about **monthly electricity/gas cost**, not only sticker price.

Secondary audience: **retailers / installers** who want inbound “Request Info / Delivery / Service” leads instead of building their own compare site.

This is **not** trying to replace Daraz or Pakmart as a shop. It is a **compare + running-cost + lead** prototype.

## What is running today

- Public catalog from Postgres (~**22 illustrative appliances**), filters (brand, new / budget / premium / inverter), search.
- Side-by-side comparison and a running-cost calculator.
- Public forms (Request Info, Delivery, Services) save without login.
- JWT auth, register, and a **professional sidebar dashboard** (teal theme).
- **Admin** sees all inquiries and applications and can update status.
- **User** sees only their own submissions.

Demo logins (seeded):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@homecompare.pk | admin123 |
| User | user@homecompare.pk | user123 |

Prices, kWh, and gas figures are **illustrative**, not live retailer stock.

## Smoothness

**High as a demo. Medium as a product you would send strangers to.**

The public compare flow, cost calc, and dashboard are coherent. Auth and role-split records work. Layout is a classic sidebar console (not a gimmick).

Gaps that keep it from feeling “live”:

- Tiny catalog vs Daraz / Pakmart / manufacturer sites.
- No live prices, availability, or delivery SLA.
- Service applications are CRM tickets, not booked technicians.
- Same CRA family as AutoCompare — familiar, not unique.

**Smoothness: ~8/10 for a pitch demo, ~5/10 for public consumer use.**

## Public adoption chance

**Low–medium as a standalone consumer site. Medium as lead-gen for a retailer or installer network.**

Pakistan already has marketplaces for buying appliances. HomeCompare only wins if **running-cost compare** is obviously better than a price list — and if the numbers are believed.

Realistic path:

1. Partner with 1–2 retailers or brands; replace seed data with their SKUs and tariffs.
2. Treat the dashboard as a lead inbox, not a shop admin.
3. Do not expect organic consumer adoption from a 22-item catalog on a comparisonengine subdomain.

**Adoption chance without partners: low. With a real catalog + tariff data: medium (niche, not mass).**

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

- Login: `/login` · Dashboard: `/dashboard`

## Production (VPS)

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
