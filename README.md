# Financial System Monorepo

Active stack for **The Comparison Engine**: product comparison (finOS + reseller), admin tooling, and Ollama-backed AI assistants.

Live site: [thecomparisonengine.com](https://thecomparisonengine.com) · Reseller: [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com)

## Active projects

| Project | Role | Typical ports |
|---------|------|----------------|
| [finOS](./finOS/) | Core products/clients/applications API + public comparison UI (`vanilla.html`) | Frontend `3000`, API inside Docker |
| [reseller](./reseller/) | White-label partner dashboard (products, applications, commissions) | Frontend `9004`, API `9005` |
| [qwenChat](./qwenChat/) | Read-only chatbot over finOS + reseller data | Frontend `9010`, API `9011` |
| [adminPortal](./adminPortal/) | Central admin dashboard | See `adminPortal/README.md` |

### Removed from this repo

These were deleted from the monorepo (not part of the live stack):

- `finCompare`, `tezQarza-Gateway`, `finVault`, `gateway`, `scripts/`
- Root dump files (`*.csv`, `*.xlsx`, static `index.html`)

Do not re-add bytecode (`__pycache__`), `node_modules/`, or `dist/` — they are gitignored.

---

### 1. [finOS](./finOS/)

Source of truth for products, clients, applications, holdings, and policies.

- **Stack**: FastAPI, PostgreSQL, Docker Compose, nginx frontend
- **Public UI**: `finOS/frontend/public/vanilla.html` (eligibility, ranking, Cost/Matrix comparison)
- **AI Explain**: `POST /api/ai/explain` streams a short recommendation via host **Ollama**
  - Default model: `qwen2.5:1.5b` (CPU-friendly)
  - Ranking rules are category-specific (e.g. savings → highest profit rate; credit card → lowest APR)
  - Jurisdiction currency forced in the prompt (PK→PKR, UAE→AED, KSA→SAR)
  - Frontend prefetches on eligibility; caches until inputs change; template fallback on failure
- **Prod compose**: `docker compose -f docker-compose.prod.yml -p finos`
  - Reaches Ollama at `host.docker.internal:11434` (`extra_hosts: host-gateway`)

### 2. [reseller](./reseller/)

Partner portal for agents: browse products, submit applications into finOS, track commissions.

- **Stack**: React (Vite), FastAPI, PostgreSQL
- **Compose**: `reseller/docker-compose.yml` (`comparison_*` containers)

### 3. [qwenChat](./qwenChat/)

Streaming chat UI with quick-action tables (GET-only live data) plus free-form Qwen chat.

- **Stack**: React (Vite), FastAPI, Ollama
- **Data**: read-only calls to finOS + reseller (no create/edit/delete)
- **Default model**: `qwen2.5:1.5b` (same lightweight model as finOS AI Explain)

### 4. [adminPortal](./adminPortal/)

Administrative dashboard across the financial ecosystem. See its own README for run details.

---

## Ollama (shared LLM)

Both **finOS AI Explain** and **qwenChat** expect Ollama on the host:

```bash
ollama pull qwen2.5:1.5b
# Recommended systemd env: OLLAMA_HOST=0.0.0.0:11434, OLLAMA_NUM_PARALLEL=1,
# OLLAMA_MAX_LOADED_MODELS=1, OLLAMA_KEEP_ALIVE=-1
```

Env knobs (finOS / qwenChat):

- `OLLAMA_BASE_URL` — default `http://host.docker.internal:11434` in Docker
- `OLLAMA_MODEL` — default `qwen2.5:1.5b`
- `OLLAMA_TIMEOUT` — finOS default `300` (SSE can run long on CPU)

Health check: `GET /api/ai/health` on finOS (e.g. via `:3000`).

---

## Setup

Run each project from its directory (usually `docker compose up -d --build`). Copy `.env.example` → `.env` where present.

**Production (VPS) sketch:**

1. Host Ollama with `qwen2.5:1.5b`
2. finOS: `docker compose -f docker-compose.prod.yml -p finos up -d --build`
3. reseller + qwenChat compose stacks as deployed on the server
4. Keep repo in sync: `git pull` on the VPS (avoid committing `__pycache__` / build artifacts)

For project-specific credentials, seeds, and API details, use each subdirectory’s `README.md`.
