# TezQarza – LFE Channel Gateway

**TezQarza** is a customer‑facing channel gateway for the Loan Facilitation Engine (LFE).  
It handles application intake, product display, document upload, and displays LFE decisions.  
All eligibility, scoring, routing, and auditing are delegated to LFE.

## Architecture

```
Frontend (React)  →  TezQarza API Gateway  →  LFE (Loan Facilitation Engine)  →  Lenders
```

## Prerequisites

- Docker & Docker Compose
- Environment variables (see `.env.example`)

## Quick Start

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in secrets (especially `ENCRYPTION_KEY` and `ADMIN_API_KEY`).
3. Build and run:
   ```bash
   docker-compose up -d --build
   ```
4. Access:
   - Frontend: http://localhost
   - API docs: http://localhost/api/docs
   - Admin sync: `POST /api/products/sync` with header `X-Admin-Key`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL credentials |
| `SECRET_KEY` | JWT secret |
| `CORS_ORIGINS` | Comma‑separated allowed origins |
| `ENVIRONMENT` | `development` / `staging` / `production` |
| `LFE_BASE_URL` | LFE service URL |
| `LFE_API_KEY` | API key for LFE |
| `ENCRYPTION_KEY` | 32‑byte base64 key (generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key())"`) |
| `ADMIN_API_KEY` | Admin API key for protected endpoints |

## Testing the Admin Endpoint

```bash
curl -X POST http://localhost:8000/api/products/sync -H "X-Admin-Key: your-secure-admin-api-key"
```

## Production Deployment

- In production, set `ENVIRONMENT=production` to avoid auto‑sync of products on startup.
- Use a scheduled job (e.g., Celery) to call `/api/products/sync` periodically.
- Replace the mock LFE client with a real one by editing `lfe_client.py`.
- For retries, implement a robust worker (Celery, RQ, or AWS SQS).

## License

Proprietary – for internal use only.
