# QwenChat

Professional read-only chatbot for the Financial System monorepo.

- **Frontend**: React (Vite) → `http://localhost:9010`
- **Backend**: FastAPI → `http://localhost:9011`
- **LLM**: Ollama `qwen2.5:0.5b`
- **Data**: live **GET-only** calls to finOS + reseller (no create/edit/delete)

## Features

- Streaming chat UI with status indicators (Ollama / finOS / Reseller)
- Quick-action buttons that load DB snapshots (marketplace products, clients, applications, claims, resellers, commissions, etc.)
- Live JSON data panel (read-only)
- System prompt grounded on finOS + reseller domain

## Prerequisites

1. Ollama running with model `qwen2.5:0.5b` (`ollama serve` / already running)
2. Optional but recommended for live buttons:
   - finOS backend on `:8000`
   - reseller backend on `:9005`

## Local run (without Docker)

### Backend (port 9011)

```bash
cd qwenChat/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # optional
export OLLAMA_BASE_URL=http://127.0.0.1:11434
export OLLAMA_MODEL=qwen2.5:0.5b
export FINOS_API_URL=http://127.0.0.1:8000/api
export RESELLER_API_URL=http://127.0.0.1:9005/api
uvicorn app.main:app --host 0.0.0.0 --port 9011 --reload
```

### Frontend (port 9010)

```bash
cd qwenChat/frontend
npm install
npm run dev
```

Vite proxies `/api` and `/health` to `http://127.0.0.1:9011`.

## Docker Compose

Backend reads config from **`qwenChat/.env`** (`env_file` in compose). Copy the example first:

```bash
cd qwenChat
cp -n .env.example .env   # edit values for local or server
docker compose up --build
```

- Frontend: http://localhost:9010  
- Backend: http://localhost:9011  
- Docs: http://localhost:9011/docs  

On Linux, compose uses `host.docker.internal` via `extra_hosts` so the container can reach host Ollama.

**Server `.env` example** (finOS has no host `:8000` publish):

```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:3b
FINOS_API_URL=http://finos-backend-1:8000/api
RESELLER_API_URL=http://comparison_backend:8000/api
CORS_ORIGINS=http://localhost:9010,http://127.0.0.1:9010,http://163.245.222.160:9010
```

Compose joins `finos_default` so backend can reach `finos-backend-1` and `comparison_backend`.

## Read-only guarantee

Backend only uses HTTP **GET** against finOS/reseller. There are no write endpoints in QwenChat that mutate remote DBs. Quick actions map to GET routes only.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Ollama + upstream reachability |
| GET | `/api/actions` | Quick-action catalog |
| POST | `/api/data` | Fetch read-only snapshot (no LLM) |
| POST | `/api/chat` | Chat (optional `action` for context) |
| POST | `/api/chat/stream` | Streaming chat (SSE) |
