# finOS

**finOS** is the core backend and database system of record for the Financial System ecosystem. It is designed to emulate the central ledger and processing engine of a modern financial institution.

## Architecture

- **Database**: PostgreSQL database serving as the source of truth.
- **Tables**: Includes core primitives such as `clients`, `products`, `applications`, `policies`, `claims`, and `holdings`.
- **API**: A FastAPI service that allows internal services (like the adminPortal) to query and manage the core data.

## Integration

Other ecosystem modules, such as **finVault**, interface with `finOS` by writing directly to its `applications` table or via APIs. `finOS` holds the canonical state of all clients and the lifecycle timelines of their financial requests.

## How to Run

1. Navigate to the `finOS` directory.
2. Start the services using Docker Compose:
```bash
docker compose up -d --build
```

The database initializes with seed data (e.g. `c1` for clients and dummy applications).
