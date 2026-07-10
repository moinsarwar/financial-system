# finCompare

**finCompare** is a microservices-based platform within the Financial System monorepo, designed to aggregate, audit, and compare financial products (loans, policies, etc.) across the Pakistan financial ecosystem.

## Architecture & Services

The application is composed of several independent microservices running on **Kubernetes**:
- **api-gateway**: The main entry point for routing requests to internal services.
- **frontend-service**: The user interface for interacting with the comparison engine.
- **policy-service**: Manages and evaluates financial policies.
- **audit-service**: Handles auditing and tracking of financial transactions.
- **pil-service**: Manages personal installment loans.
- **ingestion-worker**: Background worker for ingesting external financial product data.
- **postgres-0**: The primary database for storing relational data.
- **redis-0**: In-memory data structure store used as a database, cache, and message broker.

## Prerequisites

- **Kubernetes Cluster**: K3s, Minikube, or Docker Desktop K8s.
- **kubectl**: Configured to point to your local or remote cluster.
- **Docker**: To build images (if making changes to source code).

## How to Start the Project

This project uses Kubernetes manifests for deployment. All resources are deployed within the `fincompare` namespace.

### 1. Apply Kubernetes Manifests
Navigate to the `finCompare` directory and run the deployment script or apply manifests manually:

```bash
cd finCompare/k8s
kubectl apply -f namespace.yaml
kubectl apply -f postgres-pv.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
# ... apply other services
```

Alternatively, you can use the provided deployment scripts if available:
```bash
./deploy.sh
```

### 2. Verify Deployment
Check if all pods are running successfully:
```bash
kubectl get pods -n fincompare
```

### 3. Access the Application
- The **Frontend** can be accessed via the configured node port or ingress (usually `http://localhost:30002` or port `80` depending on your K8s setup).
- The **API Gateway** handles backend routing and provides unified endpoints for the frontend.
