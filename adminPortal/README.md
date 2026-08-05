# adminPortal

Operations console for **The Comparison Engine**: Docker container control plus browser-side admin screens against finOS.

## How it works

1. **Login** — local admin users in SQLite (`admin.db`); simple JWT for the portal API.
2. **Docker ops** — list containers, CPU/memory stats, start/stop/remove via mounted `docker.sock`.
3. **finOS admin UI** — the **browser** calls finOS directly (`/api/admin_portal/*`) for clients, applications (advance status), products/marketplace, claims, documents.
4. **Projects view** — quick links to finOS / related service URLs.

adminPortal does **not** replace finOS or reseller databases; it is a control panel.

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

Unlike qwenChat/reseller, the adminPortal **backend** is mainly Docker + local auth; finOS data UIs talk to finOS from the frontend.

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
