# GreenDrive Pakistan

Sharia-compliant green product marketplace (solar, EV, battery, appliances) with Murabaha BNPL, savings compare, and vendor/admin dashboards.

Frontend is the HTML UI wired to the FastAPI `/api` backend. Products, applications, repayments, and documents are real DB operations (not a client-side simulation).

## Ports (host)

| Service  | Port |
|----------|------|
| Frontend | 9013 |
| Backend  | 9012 |
| Postgres | 5434 |

DB: `greendrive` / `greendrive` / `greendrive`

## Quick start

```bash
cd GreenDrivePakistan
docker compose up -d --build
```

- App: http://localhost:9013
- API docs: http://localhost:9012/docs
- Health: http://localhost:9012/health

Uploads persist in the Docker volume `gd_uploads` (`UPLOAD_ROOT=/app/uploads`).

## Real operations

- **Auth:** Admin is a seeded DB `User` with `role=admin` (JWT from `user.role`). No hardcoded admin login path.
- **Products:** Vendor/admin CRUD via `POST/PUT/DELETE /api/products/` (soft-delete sets `is_active=false`). Catalog is served from the DB.
- **Applications:** Vendor/admin can `PATCH /api/applications/{id}/status`. Approving/activating with empty repayments generates a schedule.
- **Repayments:** `POST /api/applications/{id}/repayments/{rid}/pay` marks paid and updates application balances.
- **Documents:** Multipart upload to `POST /api/documents/upload` (disk + `documents` table); list/download under `/api/documents/...`.

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

## Stack

- Backend: FastAPI, SQLAlchemy, Postgres, JWT (passlib/bcrypt==4.0.1)
- Frontend: static HTML + nginx (`/api` proxied to backend)
- Seed on startup (catalog + demo apps); always ensures admin user exists
