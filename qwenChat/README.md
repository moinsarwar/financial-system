# qwenChat (Comparison Engine Chat)

Read-only **assistant** over live finOS + reseller data, plus free-form Q&A via the same host Ollama model used by finOS AI Explain.

## Who this targets

**Internal operators and demos** — “what’s in the catalog / how many applications / explain this JSON snapshot” — not end users shopping for a loan.

It is a **read-only ops copilot** on top of The Comparison Engine, not a consumer chatbot product.

## What is running today

1. UI shows health for **Ollama / finOS / Reseller**.
2. **Quick actions** load GET-only snapshots (products, clients, applications, claims, marketplace, resellers, commissions, categories) into a JSON panel — no LLM required for the fetch.
3. **Chat / stream** sends the user message (and optional action context) to Ollama with a system prompt grounded on Comparison Engine domain data.
4. Backend never creates/updates/deletes remote records — **HTTP GET only** against upstreams.
5. No database of its own (stateless).

Model is `qwen2.5:1.5b` on host Ollama (CPU-friendly, limited quality).

## Smoothness

**Good enough for internal Q&A. Weak as a product.** Health + snapshots + stream chat work when finOS, reseller, and Ollama are up. The 1.5b model will hallucinate or stay vague; snapshots are the trustworthy part.

No auth productization, no write tools, no conversation store. That is correct for a lab tool and insufficient for anything public.

**Smoothness: medium for ops, low for anyone outside the team.**

## Public adoption chance

**None as a public product.**

People will not adopt a small-model chat over internal comparison APIs. There is no consumer job, no brand, and no reason to expose live application JSON. Keep it off the public marketing surface. If AI for customers matters, that path is **finOS AI Explain** on the comparison page — not this app.

## How it works

See “What is running today.” qwenChat does **not** own products or applications; it only reads them for chat context.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (`backend/app/main.py`) |
| DB | None (stateless) |
| LLM | Host Ollama `qwen2.5:1.5b` |
| Deploy | `docker-compose.yml` |

## Ports

| Service | Host |
|---------|------|
| Frontend | `9010` |
| Backend | `9011` → 8000 |

## Relation to other projects

| Direction | Integration |
|-----------|-------------|
| → finOS | `FINOS_API_URL` (Docker: `http://finos-backend-1:8000/api`) |
| → reseller | `RESELLER_API_URL` (Docker: `http://comparison_backend:8000/api`) |
| → Ollama | `OLLAMA_BASE_URL` (`host.docker.internal:11434`) |
| Network | Joins **`finos_default`** for service DNS |

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Ollama + upstream reachability |
| GET | `/api/actions` | Quick-action catalog |
| POST | `/api/data` | Read-only snapshot (no LLM) |
| POST | `/api/chat` | Chat |
| POST | `/api/chat/stream` | Streaming chat (SSE) |

Code: `backend/app/routes/chat.py`, `services/data.py`, `services/ollama.py`.

## Notable changes

- Shared lightweight model with finOS: **`qwen2.5:1.5b`**
- Streaming chat + action-aware prompts with authoritative counts
- Docker `extra_hosts` for host Ollama on Linux
- Server `.env` points at container DNS (`finos-backend-1`, `comparison_backend`)

## Run

### Docker

```bash
cd qwenChat
cp -n .env.example .env   # edit for local or VPS
docker compose up -d --build
```

- UI: http://localhost:9010  
- API: http://localhost:9011 · Docs: `/docs`

### Local (no Docker)

```bash
# Backend :9011
cd qwenChat/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OLLAMA_BASE_URL=http://127.0.0.1:11434
export OLLAMA_MODEL=qwen2.5:1.5b
export FINOS_API_URL=http://127.0.0.1:8000/api
export RESELLER_API_URL=http://127.0.0.1:9005/api
uvicorn app.main:app --host 0.0.0.0 --port 9011 --reload

# Frontend :9010
cd qwenChat/frontend && npm install && npm run dev
```

### Server `.env` example

```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:1.5b
FINOS_API_URL=http://finos-backend-1:8000/api
RESELLER_API_URL=http://comparison_backend:8000/api
CORS_ORIGINS=http://localhost:9010,https://thecomparisonengine.com
```
