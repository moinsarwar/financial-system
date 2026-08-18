# AutoCompare PK

Car comparison for Pakistan: assembled vs imported models, specs and running-cost style compare, public info requests, and **login-gated test-drive** bookings with an admin/user dashboard.

Live: [autocompare.thecomparisonengine.com](https://autocompare.thecomparisonengine.com)

## Who this targets

**New-car shoppers in Pakistan** who want a shortlist (origin, manufacturer, budget band) before talking to a dealer — not people hunting used cars on PakWheels or OLX.

Secondary audience: **dealers / importers** who want structured “Request Info” and “Test Drive” leads instead of WhatsApp screenshots.

This is a **compare + lead-gen prototype**, not a classifieds marketplace and not live dealer inventory.

## What is running today

- Public catalog from Postgres (**30 seeded vehicles** from `backend/app/vehicles.json`).
- Filters: assembled / imported, manufacturer, new / other bands, search.
- Side-by-side comparison and cost calculator.
- **Request Info** is public and stored.
- **Test Drive** requires login; bookings show on the dashboard.
- JWT auth + professional sidebar dashboard (navy/slate theme).
- Admin sees all inquiries and test drives and can follow up; users see their own.

Demo logins (seeded):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@autocompare.pk | admin123 |
| User | user@autocompare.pk | user123 |

Prices and specs are **illustrative**. There is no live stock, booking calendar, or dealer SLA.

## Smoothness

**High as a demo. Medium as a public car site.**

The compare flow matches HomeCompare (same CRA family, different catalog and navy theme). Dashboard records are full-width rows, easy to scan. Login wall on test drive is the right product choice.

Gaps:

- 30 static cars vs PakWheels / manufacturer configurators.
- No real dealer, city, or slot management for test drives.
- No used-car / inspection / financing integration.
- Feels like a complete **lead toy**, not a marketplace.

**Smoothness: ~8/10 pitch demo, ~4–5/10 public consumer use.**

## Public adoption chance

**Low–medium.** Used-car traffic already lives on PakWheels and OLX. New-car compare exists on brand sites and a few aggregators.

AutoCompare can get **dealer adoption** (not mass consumer adoption) if:

1. Inventory and prices come from real dealers.
2. Test-drive requests are answered on a clock.
3. The site is distributed by those dealers, not discovered as a 30-car catalog on a comparisonengine subdomain.

**Without dealer partners: low. With 5–10 dealers and live stock: medium as lead-gen, still not a PakWheels competitor.**

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 (CRA), nginx |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL 15 |

## Ports

| Service | Host port |
|---------|-----------|
| Frontend | **9016** |
| Backend API | **9019** |
| Postgres | **5437** |

## Quick start (WSL2 Docker)

```bash
cd ~/financial-system/AutoCompare
docker compose up -d --build
```

- App: http://localhost:9016
- API docs: http://localhost:9019/docs
- Login: `/login` · Dashboard: `/dashboard`

Keep frontend on **9016** so Caddy (`autocompare.thecomparisonengine.com` → `127.0.0.1:9016`) still works.

## Production (VPS)

```bash
ssh root@163.245.222.160 "cd /root/financial-system && git pull origin main && cd AutoCompare && docker compose up -d --build"
```

Frontend nginx proxies `/api` → backend.

## API (main)

| Method | Path |
|--------|------|
| GET | `/api/vehicles` |
| GET | `/api/vehicles/{key}` |
| GET | `/api/comparison/{key_a}/{key_b}` |
| GET | `/api/costs/{key}` |
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| GET | `/api/auth/me` |
| POST | `/api/inquiries` |
| POST | `/api/applications` (test-drive; login required) |
| PATCH | `/api/applications/{id}/status` (admin) |
| GET | `/api/dashboard/stats` |
| GET | `/api/dashboard/inquiries` |
| GET | `/api/dashboard/applications` |

See `http://localhost:9019/docs` for the live contract.
