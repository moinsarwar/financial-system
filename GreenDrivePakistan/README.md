# GreenDrive Pakistan

Sharia-compliant **green product marketplace** (solar, EV, battery, appliances) with Murabaha BNPL, dynamic savings compare, documents, repayments, and vendor/admin dashboards.

**Live:** https://greendrivepakistan.thecomparisonengine.com

## Who this targets

| Audience | Job to be done |
|----------|----------------|
| **Households / SMEs in Pakistan** | Buy solar, EV, or efficient kit and see **installment vs bill savings** under a Murabaha-style profit, not interest-as-APR theatre |
| **Vendors** | List products, take cash or BNPL applications, approve/reject |
| **Platform admin** | Vendors, lenders (profit % + max tenure), compare formula defaults, catalog |

This is the **strongest vertical product story** in the repo after finOS: green + Sharia finance is a real Pakistan market, not a generic clone of Daraz.

## What is running today

Frontend is a **React (Vite + TypeScript + Tailwind)** SPA served by nginx; `/api` is proxied to FastAPI. Products, vendors, users, applications, repayments, documents, and compare results are **real DB operations** (not a client-side simulation).

- Marketplace + compare using the **active lender**, down payment %, tenure, and savings horizon.
- Vendor and admin CRUD on products; admin manages vendors, lenders, users (`role=user` only in that UI).
- Applications: approve generates repayments; pay endpoint updates balances.
- Documents: multipart upload + list/download.
- Optional **AI recommend** on Compare via host Ollama (`qwen2.5:1.5b`) — not qwenChat.

Seeded demo accounts exist (`user@demo.com`, `vendor@demo.com`, `admin@demo.com`, etc.). Catalog and numbers are **illustrative**.

## Smoothness

**Highest of the Pakistan verticals.** Roles, formula, documents, and repayments are wired. UI is TypeScript + Tailwind (ahead of the CRA HomeCompare/AutoCompare/Drive2Earn family).

Still a marketplace **prototype**:

- Demo logins and a small illustrative catalog.
- “Pay” is an API balance update, not JazzCash / card / bank.
- Sharia / SBP posture is product copy and Murabaha math — not a fatwa pack or licensed NBFC flow.
- AI recommend is a small CPU model over candidate rows.

**Smoothness: ~8/10 for a working marketplace demo, ~5/10 for public checkout.**

## Public adoption chance

**Medium — best vertical odds in the monorepo besides the Comparison Engine core.**

Solar and EV financing in Pakistan is a real demand. People will not treat this as a shop until:

1. Real vendors own real SKUs and installation.
2. Profit rate and tenure come from an actual financier.
3. CNIC / application / payment feel legitimate.

**Without those three: low consumer adoption (nice demo). With a vendor + lender pair: medium, and higher than HomeCompare/AutoCompare because the category is less crowded with a Sharia + savings-compare angle.**

## Ports (host)

| Service  | Port |
|----------|------|
| Frontend | 9013 |
| Backend  | 9012 |
| Postgres | 5434 |

DB: `greendrive` / `greendrive` / `greendrive`

## Quick start (WSL2 Docker only)

Use **native Docker Engine inside WSL2 Ubuntu** (not Windows Docker Desktop CLI):

```bash
cd ~/financial-system/GreenDrivePakistan
sudo service docker start   # if daemon is down
docker compose up -d --build
```

- App: http://localhost:9013
- API docs: http://localhost:9012/docs
- Health: http://localhost:9012/health · http://localhost:9012/api/health

Uploads persist in the Docker volume `gd_uploads` (`UPLOAD_ROOT=/app/uploads`).

## Data model (important)

| Table | Who |
|-------|-----|
| **`users`** | Customers (`role=user`) and platform admins (`role=admin`) |
| **`vendors`** | Merchants — **separate** table (login via vendor email) |
| **`products`** | Catalog rows owned by a `vendor_id` |
| **`lenders`** | Profit rate + **max tenure**; one active lender drives financing |
| **`compare_settings`** | Default down-payment % and net-saving horizon years |

Marketplace / Compare show **all active products** from every vendor. A vendor dashboard only lists **that vendor’s** products.

## Admin capabilities

- **Vendors:** list / add / edit (name, email, password, description, active)
- **Platform users:** list / add / edit — **only `role=user`** (admins are hidden; role cannot be changed to admin here)
- **Products:** full add/edit form for any vendor (name, price, category, type, description, saving factors, savings, warranty, installation, payback, rating)
- **Lenders:** full add/edit form (name, profit %, max tenure months) + set active + recalculate product profits
- **Compare formula defaults:** default down payment % and default horizon years (`GET/PUT /api/compare/settings`)

## Vendor capabilities

- Full **add / edit** product form (same fields as admin) for own catalog
- Soft-deactivate products, cash sales, application approve/reject

## Comparison Engine (dynamic)

`POST /api/compare/` uses the **active lender** plus optional overrides:

| Control | Behaviour |
|---------|-----------|
| Bills + compare type | Electricity / fuel / both |
| Category filter | e.g. Solar, EV, All |
| Tenure (months) | Up to active lender `max_tenure` (not hardcoded 24) |
| Down payment (%) | Reduces financed amount; **100% → installment = 0** |
| Net-saving horizon | 3 / 5 / 7 / 10 years (label + net formula) |
| Product checkboxes | Optional “Compare selected” subset |

**Installment math:**  
`down = price × down%` → `financed = (price + profit) − down` (or `0` if down ≥ 100%) → `monthly = financed ÷ tenure`.  
Monthly / yearly / horizon savings update from the new installment.

Public defaults: `GET /api/compare/financing` (lender + down % + horizon).

### AI recommend (Ollama, finOS-style)

Yellow banner on Compare can call host **Ollama** directly (`qwen2.5:1.5b`) — **not** qwenChat:

- `GET /api/compare/ai/health` — Ollama reachability + model list
- `POST /api/compare/ai-recommend` — body includes user `query` + same compare filters; server sends candidate product numbers to Ollama `/api/chat`

Env (docker-compose / host):

| Variable | Default |
|----------|---------|
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` |
| `OLLAMA_MODEL` | `qwen2.5:1.5b` |
| `OLLAMA_TIMEOUT` | `120` |

Backend uses `extra_hosts: host.docker.internal:host-gateway` so the container can reach Ollama on the WSL/host machine (same as finOS prod).

## Other real operations

- **Auth:** Admin is a seeded DB `User` with `role=admin` (JWT from `user.role`)
- **Products:** Vendor/admin CRUD via `POST/PUT/DELETE /api/products/` (soft-delete → `is_active=false`)
- **Applications:** Status patch; approve generates repayments; pay endpoint updates balances
- **Documents:** Multipart upload + list/download under `/api/documents/...`

## Seeded test accounts (local only)

Optional local credentials (not shown on the login UI):

| Role   | Email              | Password  |
|--------|--------------------|-----------|
| User   | user@demo.com      | user123   |
| User   | sara@demo.com      | user123   |
| Vendor | vendor@demo.com    | vendor123 |
| Vendor | vendor2@demo.com   | vendor123 |
| Vendor | vendor3@demo.com   | vendor123 |
| Admin  | admin@demo.com     | admin123  |

## Production deploy

```bash
# from Windows OpenSSH (not WSL ssh)
ssh root@163.245.222.160 "cd /root/financial-system && git pull origin main && cd GreenDrivePakistan && docker compose up -d --build"
```

Caddy serves `greendrivepakistan.thecomparisonengine.com` → `127.0.0.1:9013` (nginx proxies `/api` → backend).

## Stack

- Backend: FastAPI, SQLAlchemy, Postgres, JWT (passlib/bcrypt==4.0.1)
- Frontend: React + Vite + TypeScript + Tailwind, nginx SPA
- Seed on startup (catalog + demo apps); always ensures admin user + compare settings row exist
