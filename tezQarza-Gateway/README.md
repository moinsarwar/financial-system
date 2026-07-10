# TezQarza-Gateway

**TezQarza-Gateway** is a channel gateway within the Financial System monorepo. It connects frontend applications and external partners directly with the core backend financial systems for rapid loan processing, originations, and product listings.

## Technologies Used

- **Backend**: FastAPI (Python)
- **Frontend**: React (TypeScript, Vite/CRA)
- **Database**: PostgreSQL
- **Web Server / Proxy**: Nginx
- **Deployment**: Docker Compose

## Features

- **Product Listing**: Fetch and display available financial products from the Loan/Financial Engine (LFE).
- **Loan Applications**: Accept and process loan originations from borrowers.
- **Dashboard Analytics**: Provide administrative insights into total applications, match rates, and rejection reasons.
- **Qwen Integration**: Connects with local LLM models to provide intelligent chatbot capabilities for financial assistance.

## Prerequisites

- **Docker** and **Docker Compose** installed on your system.
- Port `8080`, `8000`, and `5432` should be available.

## How to Start the Project

This project relies on Docker Compose to easily orchestrate the backend, frontend, and database services.

### 1. Configure Environment Variables
Ensure that the `.env` file exists in the root of `tezQarza-Gateway` directory with appropriate credentials (e.g., `POSTGRES_USER`, `ADMIN_API_KEY`, etc.).

### 2. Build and Run Containers
To start the services in detached mode, run:

```bash
cd tezQarza-Gateway
docker compose up -d --build
```

### 3. Verify Services
Check if all containers are running successfully:
```bash
docker compose ps
```

### 4. Access the Application
- **Frontend**: `http://localhost:8080` (Proxied via Nginx)
- **Backend API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Dashboard**: `http://localhost:8080/dashboard` (Ensure `ADMIN_API_KEY` is correctly handled for stats fetching).
