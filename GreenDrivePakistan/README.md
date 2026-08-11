# GreenDrive Pakistan

Sharia-compliant green product marketplace (solar, EV, battery, appliances) with Murabaha BNPL, dynamic savings compare, and vendor/admin dashboards.

**Live:** https://greendrivepakistan.thecomparisonengine.com

Frontend is a **React (Vite + TypeScript + Tailwind)** SPA served by nginx; `/api` is proxied to FastAPI. Products, vendors, users, applications, repayments, documents, and compare results are real DB operations (not a client-side simulation).

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
