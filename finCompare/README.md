# Financial System - Marketplace Comparison Platform

A highly scalable, microservices-based financial platform designed to ingest, process, and compare financial products from various providers. The system handles user journeys, manages sessions, and evaluates strict compliance and eligibility rules without providing direct financial recommendations.

## Architecture & Services

The platform follows an event-driven microservices architecture using **FastAPI** (Python), backed by **Kafka** for messaging, **Redis** for fast session management, and **PostgreSQL** for persistent storage.

### Infrastructure Services
* **PostgreSQL** (`5432`): Primary database for storing persistent application data.
* **Redis** (`6379`): In-memory data store used for fast session tracking and caching.
* **Zookeeper** (`2181`): Centralized service for maintaining configuration information, required by Kafka.
* **Kafka** (`9092`): Distributed event streaming platform used for audit logs, ingestion feeds, and asynchronous communication between microservices.

### Application Microservices
* **PIL Service (Product Information Layer)** (`8001:8000`): Handles ingestion of financial product feeds from providers and stores product schemas, pricing, and features.
* **Policy Service** (`8002:8000`): Evaluates products against eligibility rules and organizational policies.
* **Agent Service** (`8003:8000`): Orchestrates business logic and specific agent tools.
* **Journey Service** (`8004:8000`): Manages the state of user sessions and their specific journey flows across the platform.
* **Info Control Service** (`8005:8000`): Controls and manages the flow of information across the system.
* **Mode Control Service** (`8006:8000`): Manages execution modes (e.g., interactive vs automated processing).
* **Audit Service** (`8007:8000`): Listens to Kafka event streams to maintain strict audit trails for all actions to ensure compliance.
* **Ingestion Worker** (`8008:8000`): Background worker that processes ingested product feeds and syncs them to the database.

## Deployment

The project supports both local execution via Docker Compose and production deployment via Kubernetes.

### Running with Docker Compose
To build and start all services locally, simply run:
```bash
docker compose up --build -d
```
You can verify the services are running by accessing their respective local ports (e.g., `http://localhost:8001/health`).

### Running on Kubernetes
The project includes fully configured Kubernetes manifests for all services inside the `k8s/` directory.

To deploy to an active Kubernetes cluster:
```bash
kubectl apply -f k8s/
```
Ensure your cluster is properly configured before running the Kubernetes manifests.
