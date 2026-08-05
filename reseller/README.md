# Reseller (The Comparison Engine)

White-label **partner / agent portal**: signup with subdomain + market focus, browse finOS products, track customers/activities, and earn commissions when applications complete.

Live: [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com)

## How it works

1. **Public signup** — partner picks subdomain + category focus (`market_focus`). Reserved names: `www`, `reseller`, `api`, `admin`, etc.
2. **Verify** — finOS public UI calls `GET /api/resellers/verify?subdomain=…` so partner sites only show allowed categories.
3. **Products** — backend proxies finOS `front_products` (no local product catalog).
4. **Owner dashboard** — stats, customers, activities, shareable partner link (`{sub}.thecomparisonengine.com`).
5. **Admin dashboard** — approve/manage resellers and commissions.
6. **Commissions** — finOS posts to `POST /api/webhooks/commission` when an application is approved (e.g. ~10% of amount); reseller records customer + activity.

Seed example partners: `ahmedfin`, `fatimahome`, `usmaninsure`.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Create React App, nginx in Docker |
| Backend | FastAPI (`backend/app/main.py`) |
| DB | PostgreSQL 15 (`comparison` / container `comparison_db`) |
| Deploy | `docker-compose.yml` → `comparison_frontend`, `comparison_backend`, `comparison_db` |

## Ports

| Service | Host |
|---------|------|
| Frontend | `9004` → 80 |
| API | `9005` → 8000 |
| Postgres | `5433` → 5432 |

## Relation to other projects

| Direction | Integration |
|-----------|-------------|
| → finOS | `FINOS_API_URL=http://finos-backend-1:8000/api` (joins **`finos_default`**) |
| ← finOS | Commission webhook; applications may carry `reseller_subdomain` |
| ← finOS vanilla | Public verify + category filter for partner subdomains |
| ← qwenChat | Read-only GETs (resellers, commissions, marketplace helpers) |

Build-time frontend: `REACT_APP_FINOS_PUBLIC_HOST=thecomparisonengine.com` for partner links.

## Key routes

| Area | Paths |
|------|--------|
| Auth | `/api/auth…` |
| Partners | `/api/resellers`, `/api/resellers/verify` |
| Catalog proxy | `/api/products…` (from finOS) |
| CRM-ish | `/api/customers`, `/api/activities`, `/api/testimonials` |
| Money | `/api/webhooks/commission` |

Useful frontend helpers: `frontend/src/utils/categories.js`, `resellerSiteUrl.js`.

## Notable changes

- Live **categories** from finOS with marketplace catalog + product counts
- Signup stores category ids as `market_focus`; verify drives finOS UI filter
- Product browse is finOS-backed (proxy), not a duplicate DB
- Commission webhook creates/updates customer + activity on approval
- Partner subdomain linking to comparisonengine.com hosts

## Run

```bash
cd reseller
docker compose up -d --build
```

- UI: http://localhost:9004  
- API: http://localhost:9005  
- Docs: http://localhost:9005/docs  

Requires finOS on the shared Docker network for live products (`finos-backend-1`).
