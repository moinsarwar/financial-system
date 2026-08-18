# Reseller (The Comparison Engine)

White-label **partner / agent portal**: signup with subdomain + market focus, browse finOS products, track customers/activities, and earn commissions when applications complete.

Live: [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com)

## Who this targets

**Financial agents and small brokers** who want a comparison site under their own subdomain without building a catalog. They pick a category focus (savings, cards, loans, insurance), share `{sub}.thecomparisonengine.com`, and expect a cut when an application is approved in finOS.

This is **B2B distribution** for finOS, not a consumer destination. End users still compare on the finOS public UI.

## What is running today

1. **Public signup** — partner picks subdomain + `market_focus`. Reserved names: `www`, `reseller`, `api`, `admin`, etc.
2. **Admin approve** → Brevo SMTP set-password email → `/set-password?token=…` → login.
3. **Verify** — finOS public UI calls `GET /api/resellers/verify?subdomain=…` so partner sites only show allowed categories.
4. **Products** — backend proxies finOS `front_products` (no local product catalog).
5. **Owner dashboard** — stats, customers, activities, shareable partner link.
6. **Admin dashboard** — approve/manage resellers and commissions.
7. **Commissions** — finOS posts to `POST /api/webhooks/commission` when an application is approved (e.g. ~10% of amount); reseller records customer + activity.

Seed example partners: `ahmedfin`, `fatimahome`, `usmaninsure`.

## Smoothness

**Complete partner loop, CRA-era UI.** Signup, pending, approve, password, dashboards, and webhook are wired. It feels like a working affiliate portal, not a consumer app.

Friction for real partners:

- Depends 100% on finOS being up and having products worth showing.
- Commission is recorded on webhook; there is no production payout rail, tax invoice, or dispute flow.
- Frontend is Create React App, visually behind the finOS staff portal.
- Email (Brevo) must be configured or the set-password step dies.

**Smoothness: medium–high for a demo partner. Medium for signing real agents.**

## Public adoption chance

**Medium if finOS has a live catalog and commissions actually pay. Near zero otherwise.**

White-label comparison + commission is a proven model (aggregators, insurance brokers). Agents will adopt this **only** when:

1. The comparison page looks credible to their clients.
2. Applications they send actually convert.
3. Money arrives on a schedule they can trust.

Treat reseller as the **go-to-market surface** for finOS, not as a standalone public product. Consumer “adoption” of reseller.com itself is not the goal — **partner count and paid commissions** are.

## How it works

See the numbered flow under “What is running today”. Canonical products stay in finOS.

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
- **Option A auth:** signup → pending → admin `POST /api/resellers/{id}/approve` → Brevo SMTP set-password email → `/set-password?token=…` → login

Copy `comparison-engine/reseller/.env.example` → `.env` and fill SMTP (`MAIL_*`) + `FRONTEND_URL`.

## Run

```bash
cd comparison-engine/reseller
docker compose up -d --build
```

- UI: http://localhost:9004  
- API: http://localhost:9005  
- Docs: http://localhost:9005/docs  

Requires finOS on the shared Docker network for live products (`finos-backend-1`).
