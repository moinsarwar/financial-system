# finOS

**finOS** is the core backend and database system of record for the Financial System ecosystem. It is designed to emulate the central ledger and processing engine of a modern financial institution.

## Architecture

- **Database**: PostgreSQL database serving as the source of truth.
- **Tables**: Includes core primitives such as `clients`, `products`, `applications`, `policies`, `claims`, `holdings`, `information_request`, and `communication`.
- **API**: A FastAPI service that allows internal services (like the adminPortal) to query and manage the core data.

## Integration

Other ecosystem modules, such as **finVault**, interface with `finOS` by writing directly to its `applications` table or via APIs. `finOS` holds the canonical state of all clients and the lifecycle timelines of their financial requests.

## Recent Features & Fixes (Changelog)

- **3-Role Portal System**: Implemented a unified 3-role portal (Client, Operations, and Company Admin).
- **Admin Dashboard Integration**: Added a dedicated "Admin Login" and `super_admin` permissions, updating the database ENUMs dynamically to support this without losing existing operations data.
- **Upload Bug Fixes**: Fixed a critical 422 Unprocessable Entity error in FastAPI by configuring the frontend Axios interceptors to automatically handle `multipart/form-data` for file uploads, overriding the default `application/json`.
- **Frontend Stability**: Implemented safeguards in the global error handler (`client.ts`) to properly parse validation arrays, preventing React application crashes (White Screen of Death).
- **UI Enhancements**: Restored the visual "Workflow" progress bar on the application details page. Added dynamic portal titles in the Header component.
- **Information Request**: Added database models and infrastructure for Information Requests and Communications between Ops and Clients.

## How to Run

1. Navigate to the `finOS` directory.
2. Start the services using Docker Compose:
```bash
docker compose up -d --build
```

The database initializes with seed data (e.g. `client@finos.com`, `ops@finos.com`, and `admin@finos.com`).
