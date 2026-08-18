# adminPortal

Operations console for **The Comparison Engine**: Docker container control plus browser-side admin screens against finOS.

## Who this targets

**Internal ops / the person who SSH’s the VPS** — not customers, not partners, not the public.

Use it to see containers, start/stop/remove them, and work finOS admin screens (clients, applications, products, claims, documents) without living in `docker compose` and curl.

## What is running today

1. **Login** — local admin users in SQLite (`admin.db`); simple JWT for the portal API.
2. **Docker ops** — list containers, CPU/memory stats, start/stop/remove via mounted `docker.sock`.
3. **finOS admin UI** — the **browser** calls finOS directly (`/api/admin_portal/*`).
4. **Projects view** — quick links to finOS / related service URLs.

adminPortal does **not** replace finOS or reseller databases; it is a control panel.

## Smoothness

**Fine as an internal tool. Not a product.** Docker stats and finOS screens are useful when the env vars point at a reachable finOS API. Mounting `docker.sock` is powerful and easy to get wrong (anyone who can log into this portal can affect host containers).

SQLite admins are independent of finOS roles — that is convenient and also a second identity store to keep locked down.

**Smoothness: medium (ops utility). Do not polish this for “users.”**

## Public adoption chance

**None — and it must stay that way.**

This should never be a public consumer or partner app. Exposing it would be a **security problem**, not a growth metric. Success is “ops can run the stack without guessing compose names,” not signups.

## How it works

See “What is running today.” Unlike qwenChat/reseller, the adminPortal **backend** is mainly Docker + local auth; finOS data UIs talk to finOS from the frontend.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind, lucide, SweetAlert2 |
| Backend | FastAPI + Docker SDK (`backend/main.py`) |
| DB | SQLite `admin.db` (override with `DATABASE_URL`) |
| Deploy | `docker-compose.yml` |

## Ports

| Service | Host |
|---------|------|
| Backend | `9000` → 8000 |
| Frontend | `9001` → 5174 |

## Relation to other projects

| Direction | Integration |
|-----------|-------------|
| → finOS (from browser) | `VITE_FINOS_BACKEND_URL` or fallbacks (`:8000` / prod `:3000` nginx `/api`) |
| → Docker engine | `/var/run/docker.sock` for container lifecycle |
| Network | Usually **not** on `finos_default`; finOS traffic is browser→finOS host |

## Notable changes / capabilities

- Container list + resource stats for the VPS stack
- finOS admin surfaces mirrored in `frontend/src/components/finos/*`
- Local SQLite admins independent of finOS user roles

## Run

```bash
cd adminPortal
docker compose up -d --build
```

- UI: http://localhost:9001  
- API: http://localhost:9000  

Compose typically sets `VITE_API_URL=http://localhost:9000`. Point `VITE_FINOS_BACKEND_URL` at a reachable finOS API for admin screens to load data.
