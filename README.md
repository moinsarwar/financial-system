# Financial System Monorepo

**The Comparison Engine** — product comparison, partner resellers, admin ops, and Ollama-backed AI, plus Pakistan vertical prototypes (green marketplace, appliances, cars, driver vehicle access).

| Live host | Serves |
|-----------|--------|
| [thecomparisonengine.com](https://thecomparisonengine.com) | finOS public comparison UI |
| `*.thecomparisonengine.com` (partner subdomains) | Same finOS UI, category filter via reseller verify |
| [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com) | Reseller partner portal |
| [greendrivepakistan.thecomparisonengine.com](https://greendrivepakistan.thecomparisonengine.com) | GreenDrivePakistan marketplace |
| [appliance-comparison.thecomparisonengine.com](https://appliance-comparison.thecomparisonengine.com) | HomeCompare PK — appliance comparison |
| [autocompare.thecomparisonengine.com](https://autocompare.thecomparisonengine.com) | AutoCompare PK — car comparison |
| [drive-to-earn.thecomparisonengine.com](https://drive-to-earn.thecomparisonengine.com) | Drive to Earn — vehicle access for earning drivers |

## What this repo is targeting

This is a **Pakistan / GCC comparison-and-lead-gen platform**, not a single consumer app.

| Layer | Target |
|-------|--------|
| **finOS + reseller** | People comparing savings, cards, loans, and insurance — and partners who white-label that comparison and earn commission |
| **GreenDrive** | Households and vendors buying solar / EV / green kit on Sharia Murabaha BNPL |
| **HomeCompare** | Households comparing ACs, fridges, washers by specs **and running cost** |
| **AutoCompare** | New-car shoppers comparing assembled vs imported models, then requesting info or a test drive |
| **Drive2Earn** | Gig / earning drivers who need a bike, rickshaw, car, or fleet on income, not a cash down payment |
| **qwenChat / adminPortal** | Internal ops only — not public products |

## Smoothness vs public adoption (honest)

Everything below is **live as a demo** with seeded catalogs and demo logins. None of the verticals have live retailer prices, real bank/dealer feeds, KYC, or production payments.

| Project | Smoothness today | Public adoption chance | Why |
|---------|------------------|------------------------|-----|
| **finOS** | Highest in the repo. Ranking, Cost/Matrix, AI Explain, staff portal, partner subdomains all work. Public UI is still `vanilla.html` (staff portal is React). Catalog is illustrative, not live bank rates. | **Medium** as a B2B comparison engine if real product data and brand trust arrive. Low as a mass consumer brand until rates are live and a trusted name sits in front. | Comparison sites win on data quality. The engine is real; the catalog is not yet a market source of truth. |
| **reseller** | Signup → admin approve → set-password → dashboards → commission webhook is a complete partner loop. Depends entirely on finOS being up. CRA stack, not as polished as the Vite staff portal. | **Medium if finOS has real products and commissions actually pay.** Affiliate/white-label is a proven model. Near zero without a live catalog and payout ops. | Partners only stay if there is something to sell and money to collect. |
| **GreenDrive** | Most complete vertical: vendor + admin + user roles, Murabaha math, compare, documents, repayments, AI recommend. TypeScript + Tailwind. Still demo accounts and an illustrative catalog. | **Medium.** Solar/EV financing in Pakistan is a real market. Needs real vendors, Sharia/SBP posture, and payments before the public will treat it as a shop. | Stronger unique story than generic appliance/car compare. Still a marketplace prototype. |
| **HomeCompare** | Full public compare + running-cost calculator + JWT dashboard. ~22 seeded appliances. Professional sidebar console. Demo prices, not Daraz/Pakmart live stock. | **Low–medium as a standalone consumer site** (Pakmart/Daraz already exist). **Medium as lead-gen** for retailers/installers if the catalog and prices become real. | Differentiator is **running cost**, not listing count. Too small to compete as a marketplace. |
| **AutoCompare** | Same pattern as HomeCompare: 30 seeded cars, compare, cost calc, info requests, login-gated test drives, admin dashboard. Not dealer inventory. | **Low–medium.** PakWheels / OLX dominate. Viable as a **dealer lead-gen** prototype, not as a public used-car platform. | Comparison UX is smooth enough to demo; adoption needs live inventory and dealer SLAs. |
| **Drive2Earn** | Calculator, affordability estimates, apply-with-login, admin follow-up. Only **4 vehicle types**. Explicitly not a credit decision. | **Medium niche, low mass-market.** Gig drivers needing vehicle access is a real gap (Careem / InDrive / Bykea). Not launch-ready without a lender/fleet partner, KYC, and a real fleet. | Best unique positioning of the three PK compare toys; smallest catalog and highest compliance bar. |
| **qwenChat** | Works as a read-only ops chat over live APIs + a 1.5b CPU model. No DB, no write path. | **None as a public product.** Internal / demo assistant. | Small model, internal data, no consumer job-to-be-done. |
| **adminPortal** | Useful ops console (Docker + finOS admin screens). Docker socket access is powerful and risky. | **None, and should stay that way.** Internal VPS tool. | Public adoption would be a security incident, not a success metric. |

**Bottom line:** the Comparison Engine core (finOS + reseller) is the piece most worth taking public as a **partner platform**. GreenDrive is the strongest vertical story. HomeCompare / AutoCompare / Drive2Earn are **polished demos for pitches and lead-gen**, not consumer products ready for mass public adoption.

## How the pieces relate

```text
                    Host Ollama :11434  (qwen2.5:1.5b)
                         ↑                    ↑
                   finOS backend         qwenChat backend
                         ↑                    ↑
                    Docker network: finos_default
                         ↑
                   reseller backend (comparison_backend)
                         ↑
              qwenChat also GETs reseller APIs

  Public user  →  finOS vanilla.html  →  eligibility / rank / Cost / Matrix / AI Explain
       │
       └── partner subdomain → GET reseller…/api/resellers/verify → filter categories

  Partner agent → reseller UI → products proxied from finOS → applications into finOS
       │
       └── finOS app status change → POST comparison_backend…/api/webhooks/commission

  Ops admin → adminPortal UI → browser calls finOS /api/admin_portal/*
            → adminPortal backend → Docker socket (container ops)
```

| Caller | Calls | Purpose |
|--------|-------|---------|
| reseller backend | `finos-backend-1:8000/api` | Marketplace products (`front_products`) |
| qwenChat backend | finOS + reseller APIs | Read-only snapshots + chat context |
| finOS applications | `comparison_backend:8000/api/webhooks/commission` | Commission on approved apps |
| vanilla.html | `reseller.thecomparisonengine.com` | Partner verify / category focus |
| finOS + qwenChat | Ollama `host.docker.internal:11434` | AI Explain + chat |

**Canonical product data lives only in finOS.** Reseller does not own a product catalog; it proxies finOS. Applications and clients are finOS records; reseller tracks partners, customers, activities, and commissions.

The Pakistan verticals (GreenDrive, HomeCompare, AutoCompare, Drive2Earn) are **separate stacks** with their own Postgres. They do not share the finOS catalog.

## Active projects

| Project | What it does | Stack | Ports (host) |
|---------|--------------|-------|--------------|
| **[Comparison Engine](./comparison-engine/)** | finos + reseller (see below) | — | — |
| ↳ [finos](./comparison-engine/finos/) | Core SoR + public comparison + staff portal + AI Explain | FastAPI, React/Vite, PostgreSQL, nginx, Ollama | FE `3000` (prod), API internal / `8000` (dev) |
| ↳ [reseller](./comparison-engine/reseller/) | Partner signup, dashboards, commissions | FastAPI, React (CRA), PostgreSQL | FE `9004`, API `9005`, DB `5433` |
| [qwenChat](./qwenChat/) | Read-only chat over live finOS + reseller data | FastAPI, React/Vite, Ollama (no DB) | FE `9010`, API `9011` |
| [adminPortal](./adminPortal/) | Ops console + Docker control + finOS admin screens | FastAPI, React/Vite, SQLite | BE `9000`, FE `9001` |
| [GreenDrivePakistan](./GreenDrivePakistan/) | Sharia green marketplace + Murabaha BNPL + savings compare | FastAPI, React, PostgreSQL, nginx | FE `9013`, API `9012`, DB `5434` |
| [appliance-comparison](./appliance-comparison/) | HomeCompare PK — appliance specs, compare, running costs | FastAPI, React (CRA), PostgreSQL, nginx | FE `9015`, API `9014`, DB `5435` |
| [AutoCompare](./AutoCompare/) | AutoCompare PK — cars, inquiries, test-drive dashboard | FastAPI, React (CRA), PostgreSQL, nginx | FE `9016`, API `9019`, DB `5437` |
| [Drive2Earn](./Drive2Earn/) | Drive to Earn — vehicle access, estimates, applications | FastAPI, React (CRA), PostgreSQL, nginx | FE `9017`, API `9018`, DB `5436` |

Details (who it is for, smoothness, adoption, flows, env) are in each project’s `README.md`.

### Removed from this repo

`finCompare`, `tezQarza-Gateway`, `finVault`, `gateway`, `scripts/`, and root dump files (`*.csv`, `*.xlsx`, static `index.html`). Do not commit `__pycache__`, `node_modules/`, or `dist/`.

---

## Shared Ollama

Used by **finOS AI Explain**, **qwenChat**, and GreenDrive compare AI:

```bash
ollama pull qwen2.5:1.5b
# Suggested systemd: OLLAMA_HOST=0.0.0.0:11434
# OLLAMA_NUM_PARALLEL=1 OLLAMA_MAX_LOADED_MODELS=1 OLLAMA_KEEP_ALIVE=-1
```

| Variable | Typical value |
|----------|----------------|
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` (Docker) |
| `OLLAMA_MODEL` | `qwen2.5:1.5b` |
| `OLLAMA_TIMEOUT` | `300` (finOS SSE on CPU) |

Health: `GET http://localhost:3000/api/ai/health` (prod nginx).

---

## Setup (VPS sketch)

1. Host Ollama with `qwen2.5:1.5b`
2. `cd comparison-engine/finos && docker compose -f docker-compose.prod.yml -p finos up -d --build`
3. `cd comparison-engine/reseller && docker compose up -d --build`
4. Start qwenChat, GreenDrivePakistan, adminPortal, HomeCompare, AutoCompare, Drive2Earn via their compose files
5. `git pull` on the VPS to sync; avoid committing secrets or bytecode

Copy each project’s `.env.example` → `.env` where present.

**Docker:** always from WSL2 Ubuntu, never Windows Docker Desktop CLI. **SSH to prod:** Windows OpenSSH to `root@163.245.222.160`.
