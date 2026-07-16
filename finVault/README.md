# FinVault Full-Stack MVP

FinVault is the application-origination counterpart to ClaimVault. This repository converts the approved browser simulation into a persistent, authenticated MVP on the same Vault stack.

## Stack

- FastAPI and Python 3.12
- SQLAlchemy 2.0 and Alembic
- PostgreSQL 17
- React 19 and Vite
- Nginx
- Docker Compose

## Included

- Password/JWT authentication with administrator and applicant roles
- Applicant ownership checks based on persistent user IDs
- Product-specific workflows for loans, insurance, credit cards and bank accounts
- Successful outcomes derived from workflow configuration
- Optimistic application versioning and validated status transitions
- Immutable status-event history
- Conditional document requirements, including joint and business bank accounts
- Dynamic bank-account fields and required-document preview in the React form
- Secure PDF/PNG/JPEG uploads with file-signature validation, size limits and SHA-256 hashes
- Authenticated document download and safe replacement of previously stored files
- Structured information requests supporting document requests and textual questions
- Explicit applicant submission and administrator resolution of additional information
- Persistent information-request history
- Per-user message receipts and unread counts
- Application-specific message threads
- Dashboard, product filters, application detail and responsive interface
- Seed users and sample applications
- Backend API tests

## Start with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:8080
- API documentation: http://localhost:8000/docs
- Health endpoint: http://localhost:8000/health

## Seed credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `Admin123!` |
| Applicant | `ahmed` | `User123!` |
| Applicant | `sana` | `User123!` |

## Local backend verification

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest
```

## Local frontend verification

```bash
cd frontend
npm ci
npm run build
```

## Review verification completed

- Python compilation passed
- Backend tests: 4 passed
- Fresh Alembic migration passed
- Seed process passed on a clean database
- React production build passed
- `npm audit`: 0 vulnerabilities at the time of review

## Production boundary

This is a complete runnable MVP and functional implementation baseline, not a certified banking production system. Before live financial deployment, add enterprise identity/SSO, maker-checker controls, tenant isolation, encryption/KMS, malware scanning, object storage, field-level data protection, regulatory retention policies, observability, queueing, penetration testing, disaster recovery and institution-specific integrations.
