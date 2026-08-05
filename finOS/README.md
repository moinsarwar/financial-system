# finOS

**finOS** is the core backend and database system of record for the Financial System ecosystem. It is designed to emulate the central ledger and processing engine of a modern financial institution.

## Architecture

- **Database**: PostgreSQL database serving as the source of truth.
- **Tables**: Includes core primitives such as `clients`, `products`, `applications`, `policies`, `claims`, `holdings`, `information_request`, and `communication`.
- **API**: A FastAPI service that allows internal services (like the adminPortal) to query and manage the core data.

## Integration

**reseller** and **qwenChat** call finOS APIs for products, clients, and applications. `finOS` holds the canonical state of clients and financial request lifecycles.

Public comparison UX lives in `frontend/public/vanilla.html` (eligibility → ranked products → Cost/Matrix → **AI Explain**).

## AI Explain (Ollama)

- **Endpoints**: `POST /api/ai/explain` (SSE stream), `GET /api/ai/health`
- **Service**: `backend/app/services/ollama_explain.py`
- **Default model**: `qwen2.5:1.5b` via `OLLAMA_BASE_URL` / `OLLAMA_MODEL` / `OLLAMA_TIMEOUT`
- Prod compose uses `host.docker.internal:11434` so the backend container can reach host Ollama
- Category Cost ranking (engine ranks; LLM must recommend the BEST product):

| Category | Best product rule |
|----------|-------------------|
| savings | Highest profit rate; tie → lowest maintenance fee |
| credit_card | Lowest APR; tie → lowest annual fee |
| personal_loan | Lowest APR; tie → lowest processing fee |
| health_insurance | Highest coverage limit |
| motor_insurance | Lowest premium rate (% of vehicle) |
| life_insurance | Highest death benefit |

## Recent Features & Fixes (Changelog)

- **AI Explain**: Streaming Ollama explanations with category Cost/Matrix context, currency by jurisdiction, prefetch + cache in `vanilla.html`, template fallback on failure.
- **Product mapping**: Front products API maps real pricing fields (`profit_rate`, APR, fees, etc.) for comparison.
- **3-Role Portal System**: Unified portal (Client, Operations, Company Admin) with `super_admin`.
- **Upload / frontend stability**: Multipart upload handling and safer error parsing to avoid blank screens.
- **Information Request**: Models and APIs for Ops ↔ Client communications.

## How to Run

**Dev:**
```bash
cd finOS
docker compose -f docker-compose.dev.yml up -d --build
```

**Prod (as on VPS):**
```bash
cd finOS
docker compose -f docker-compose.prod.yml -p finos up -d --build
```

Ensure host Ollama is up with `qwen2.5:1.5b` before testing AI Explain. Seed logins (when seeding is enabled) include `client@finos.com`, `ops@finos.com`, and `admin@finos.com`.
