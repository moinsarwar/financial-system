# Reseller Dashboard (The Comparison Engine PK)

This project provides a white-labeled dashboard for external resellers/agents. It allows them to:
- View products from the finOS core system.
- Submit applications on behalf of clients.
- Track application statuses and commissions.

## Architecture
- **Frontend**: React (Vite)
- **Backend**: FastAPI
- **Database**: PostgreSQL (comparison_db)

## Running the project

```bash
cd reseller
docker compose up -d --build
```

- Frontend: http://localhost:9004  
- Backend API: http://localhost:9005  
- Postgres: host port `5433`  

On the VPS this stack runs as `comparison_frontend` / `comparison_backend` / `comparison_db`, with finOS reachable via the Docker network (`FINOS_API_URL`).
