# finOS

Core system of record for **The Comparison Engine**: products, clients, applications, claims, documents, and policies. Also serves the **public comparison site** and a **staff portal**.

Live: [thecomparisonengine.com](https://thecomparisonengine.com)

## Who this targets

| Audience | Job to be done |
|----------|----------------|
| **Retail users** (PK, UAE, KSA) | Rank savings, credit cards, personal loans, and health / motor / life insurance against eligibility (age, income, jurisdiction) |
| **Staff** | Client, Operations, and Company Admin roles: applications, documents, claims, information requests |
| **Partner sites** | Same public UI on `{partner}.thecomparisonengine.com`, filtered to that partner’s categories |

finOS is the **source of truth**. Reseller, qwenChat, and adminPortal consume it; they do not replace this database.

## What is running today

- Public comparison: eligibility → ranked list → **Cost** and **Matrix** tabs → **AI Explain** (Ollama stream, template fallback).
- Staff portal (React + Vite): 3 roles + `super_admin`.
- Marketplace catalog as `front_products` (profit rate, APR, fees, coverage) for reseller to proxy.
- Application lifecycle that can post a **commission webhook** to reseller on approval.
- Partner subdomain verify against reseller so white-label sites only show allowed categories.

Catalog and demo users are **seeded / illustrative**. This is not live bank or insurer pricing.

## Smoothness

**Highest in the monorepo.** The ranking rules, staff workflows, partner filter, and AI explain path are complete enough to run a real demo end-to-end.

What still feels unfinished for a public consumer launch:

- Public site is **`vanilla.html`**, while staff is a modern React/Tailwind portal — two UX generations on one product.
- Ranking is only as good as the catalog. Today that catalog is not a live feed.
- AI Explain uses `qwen2.5:1.5b` on CPU. Fine for a short “why this product” blurb; not advice, not always on-brand.
- Payments / KYC / regulated disclosures are not a consumer-grade onboarding flow.

**Smoothness score (demo): high. Smoothness score (public launch): medium.**

## Public adoption chance

**Medium as a B2B comparison engine. Low–medium as a household brand.**

People already use bank sites, PriceOye-style lists, and insurer aggregators. They will switch only if:

1. Rates and eligibility look **current and trustworthy**.
2. Applying actually reaches a human or a real underwriting path.
3. A known brand (or many partner subdomains) sits in front of the engine.

The **technical chance of adoption is decent** — the product does the comparison job. The **market chance** is gated by data partnerships, compliance copy, and distribution (reseller), not by missing screens. Treat this as the piece most worth taking public **with partners first**, consumers second.

## How it works

### Public comparison (`vanilla.html`)

1. User opens apex or a **partner subdomain** (`{partner}.thecomparisonengine.com`).
2. Optional: UI calls reseller `GET /api/resellers/verify` to restrict marketplace categories.
3. User picks a category (savings, credit card, personal loan, health / motor / life insurance).
4. Eligibility (age, income band, jurisdiction) → engine ranks eligible products.
5. **Cost** and **Matrix** tabs compare pricing/features.
6. **AI Explain** streams a short recommendation from host Ollama (prefetch + cache; template fallback on failure).

### Staff portal (React)

Three roles: **Client**, **Operations**, **Company Admin** (`super_admin`). Manage applications lifecycle, documents, dashboard, information requests.

### Backend (FastAPI)

PostgreSQL is the source of truth. Other apps (reseller, qwenChat, adminPortal) consume finOS APIs; they do not replace this DB.

## Stack

| Layer | Technology |
|-------|------------|
| Public UI | `frontend/public/vanilla.html` (served at `/` by nginx) |
| Staff UI | React 18, Vite, TypeScript, Tailwind |
| API | FastAPI (`backend/app/main.py`) |
| DB | PostgreSQL 15 |
| LLM | Host Ollama `qwen2.5:1.5b` |
| Deploy | `docker-compose.dev.yml` · `docker-compose.prod.yml` (`-p finos`) |

## Ports

| Environment | Frontend | Backend | DB |
|-------------|----------|---------|-----|
| Prod | `3000→80` | expose `8000` (no host publish) | internal |
| Dev | `5173` | `8000` | `5432` |

## Relation to other projects

| Direction | Integration |
|-----------|-------------|
| ← reseller | Proxies `GET /api/front_products`; verifies partner subdomains |
| → reseller | On application status changes, `POST http://comparison_backend:8000/api/webhooks/commission` |
| ← qwenChat | Read-only GETs for products/clients/applications/claims |
| ← adminPortal (browser) | `/api/admin_portal/*` for ops CRUD |
| → Ollama | AI Explain via `OLLAMA_BASE_URL` |

Shared Docker network: **`finos_default`** (reseller + qwenChat join this to reach `finos-backend-1`).

## AI Explain

| Item | Detail |
|------|--------|
| Endpoints | `POST /api/ai/explain` (SSE), `GET /api/ai/health` |
| Code | `backend/app/services/ollama_explain.py`, `backend/app/api/routes/ai.py` |
| Env | `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT` |
| Prod networking | `extra_hosts: host.docker.internal:host-gateway` |

Category **Cost** rules (engine ranks; model must recommend BEST):

| Category | Best = |
|----------|--------|
| savings | Highest profit rate; tie → lowest maintenance fee |
| credit_card | Lowest APR; tie → lowest annual fee |
| personal_loan | Lowest APR; tie → lowest processing fee |
| health_insurance | Highest coverage limit |
| motor_insurance | Lowest premium rate (% of vehicle) |
| life_insurance | Highest death benefit |

Currency in prompts: PK→PKR, UAE→AED, KSA→SAR.

## Key API areas

`/api/auth`, `/clients`, `/applications`, `/claims`, `/products`, `/documents`, `/activity`, `/dashboard`, `/admin_portal`, `/ai`, `/front_products`

Nginx (prod): `/` → vanilla; `/api/` → backend; AI routes with buffering off and long timeouts for SSE.

## Notable changes

- Streaming **AI Explain** with Cost/Matrix context, jurisdiction currency, prefetch/cache, fallback copy
- **Front products** mapping exposes real pricing (`profit_rate`, APR, fees, coverage, etc.)
- Partner subdomain + reseller verify for white-label category focus
- Unified 3-role portal + `super_admin`
- Application → reseller **commission webhook** path
- Upload/multipart and frontend error-handling fixes
- Information Request / Ops↔Client communication models

## Run

```bash
# Dev
cd comparison-engine/finos && docker compose -f docker-compose.dev.yml up -d --build

# Prod (VPS)
cd comparison-engine/finos && docker compose -f docker-compose.prod.yml -p finos up -d --build
```

Copy `.env.example` → `.env`. Ensure Ollama has `qwen2.5:1.5b` before testing AI Explain. Demo users (when seed enabled): `client@finos.com`, `ops@finos.com`, `admin@finos.com`.
