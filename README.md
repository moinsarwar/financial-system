# Financial System Monorepo

**The Comparison Engine** — product comparison, partner resellers, admin ops, and Ollama-backed AI.

| Live host | Serves |
|-----------|--------|
| [thecomparisonengine.com](https://thecomparisonengine.com) | finOS public comparison UI |
| `*.thecomparisonengine.com` (partner subdomains) | Same finOS UI, category filter via reseller verify |
| [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com) | Reseller partner portal |
| [greendrivepakistan.thecomparisonengine.com](https://greendrivepakistan.thecomparisonengine.com) | GreenDrivePakistan marketplace |

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

## Active projects

| Project | What it does | Stack | Ports (host) |
|---------|--------------|-------|--------------|
| [finOS](./finOS/) | Core SoR + public comparison + staff portal + AI Explain | FastAPI, React/Vite, PostgreSQL, nginx, Ollama | FE `3000` (prod), API internal / `8000` (dev) |
| [reseller](./reseller/) | Partner signup, dashboards, commissions | FastAPI, React (CRA), PostgreSQL | FE `9004`, API `9005`, DB `5433` |
| [qwenChat](./qwenChat/) | Read-only chat over live finOS + reseller data | FastAPI, React/Vite, Ollama (no DB) | FE `9010`, API `9011` |
| [adminPortal](./adminPortal/) | Ops console + Docker control + finOS admin screens | FastAPI, React/Vite, SQLite | BE `9000`, FE `9001` |
| [GreenDrivePakistan](./GreenDrivePakistan/) | Sharia green marketplace + Murabaha BNPL + savings compare | FastAPI, static HTML, PostgreSQL, nginx | FE `9013`, API `9012`, DB `5434` |

Details (flows, changelog, env) are in each project’s `README.md`.

### Removed from this repo

`finCompare`, `tezQarza-Gateway`, `finVault`, `gateway`, `scripts/`, and root dump files (`*.csv`, `*.xlsx`, static `index.html`). Do not commit `__pycache__`, `node_modules/`, or `dist/`.

---

## Shared Ollama

Used by **finOS AI Explain** and **qwenChat**:

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
2. `cd finOS && docker compose -f docker-compose.prod.yml -p finos up -d --build`
3. Start reseller + qwenChat (+ adminPortal if needed) via their compose files
4. `git pull` on the VPS to sync; avoid committing secrets or bytecode

Copy each project’s `.env.example` → `.env` where present.
