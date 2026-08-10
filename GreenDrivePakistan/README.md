# GreenDrive Pakistan

Sharia-compliant green product marketplace (solar, EV, battery, appliances) with Murabaha BNPL, savings compare, and vendor/admin dashboards.

Frontend is the HTML simulation UI wired to the FastAPI `/api` backend.

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

## Demo accounts

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
- Seed on startup from the HTML simulation catalog
