# Drive to Earn

Vehicle **access** for earning drivers in Pakistan — motorbike, rickshaw, car, or fleet — with affordability estimates and applications. Not a car supermarket and **not a credit approval**.

Live: [drive-to-earn.thecomparisonengine.com](https://drive-to-earn.thecomparisonengine.com)

## Who this targets

**Gig and earning drivers** (food delivery, ride-hail, rickshaw, small fleet) who can earn daily but cannot put a full cash down payment on a vehicle.

Secondary audience: **fleet owners / financiers** who want inbound applications with a simple income-vs-payment estimate, then follow up in a dashboard.

This is the most **narrow and original** of the three PK compare toys. HomeCompare and AutoCompare compete with existing listing sites. Drive2Earn is closer to “income-based vehicle access” (Careem / InDrive / Bykea drivers + a lender or fleet).

## What is running today

1. Public site: **4 vehicle types** from Postgres (motorbike, rickshaw, car, fleet), calculator, and affordability estimate (saved).
2. Sign in / register (JWT).
3. **Apply** for a vehicle — **login required** — stored as an application.
4. Dashboard (forest-green sidebar): applications + estimates; admin can change follow-up status.
5. Explicit prototype copy: estimates are not a credit decision.

Demo logins (seeded):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@drive2earn.pk | admin123 |
| Driver | driver@drive2earn.pk | driver123 |

**Admin** sees all applications and estimates. **Driver** sees only their own.

## Smoothness

**High for a 4-product prototype. Low for a lending product.**

The public page, calculator, apply gate, and dashboard table rows work as one story. Auth and role split are clear. The dashboard is a full-bleed console (not inset in the public page padding).

Gaps that matter for anyone who would actually take a vehicle:

- Only four generic types — no make/model/year, no city, no inspection photos.
- No KYC, CNIC verification, bureau check, or real underwriting.
- No payment collection, GPS/lockbox, or repossession ops.
- Calculator assumptions are educational, not a contract.

**Smoothness: ~8/10 as a pitch site, ~3/10 as something a driver should trust with income data.**

## Public adoption chance

**Medium as a niche B2B2C story. Low as a mass public consumer app.**

The **problem is real**: drivers need bikes and cars to earn, and banks often will not touch them on paper income. The **product is not launch-ready**: four icons and a demo login are not a fleet.

Adoption can move if:

1. A fleet operator or Islamic/conventional lender owns the vehicles and the risk.
2. KYC + simple underwriting sit behind Apply.
3. The calculator is calibrated to real daily earnings and real installment schedules.

Until then, treat this as a **lead and narrative prototype** — useful for investor/partner conversations, not for unsolicited public traffic.

**Chance without a capital/fleet partner: low. With one serious partner: medium (narrow vertical, high trust bar).**

## Stack

React 18 (CRA) + FastAPI + PostgreSQL + Docker.

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

## Production (VPS)

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
