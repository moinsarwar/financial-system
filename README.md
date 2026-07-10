# Financial System Monorepo

Welcome to the **Financial System** monorepo. This repository contains the core projects designed to facilitate financial product comparison, loan processing, and integrations within the Pakistan financial ecosystem.

## Projects Overview

This repository is structured into distinct projects, each serving a specific role:

### 1. [finCompare](./finCompare/)
**finCompare** is a microservices-based platform built to aggregate, analyze, and compare financial products (such as loans, insurance policies, and savings accounts) from various banks and institutions. 
- **Tech Stack**: FastAPI, Node.js/React, PostgreSQL, Redis, Kubernetes (K3s), Docker.
- **Role**: Core comparison engine, policy ingestion, audit logging, and external product aggregation.
- **How to run**: Refer to the [finCompare README](./finCompare/README.md) for Kubernetes deployment instructions.

### 2. [tezQarza-Gateway](./tezQarza-Gateway/)
**TezQarza-Gateway** is a channel gateway that connects the frontend applications with backend financial systems for loan originations and product listing.
- **Tech Stack**: FastAPI, React, PostgreSQL, Docker Compose, Nginx.
- **Role**: Loan application processing, dashboard analytics, and API gateway for external agents (like Qwen LLM).
- **How to run**: Refer to the [tezQarza-Gateway README](./tezQarza-Gateway/README.md) for Docker Compose startup instructions.

### 3. qwen-ll (Pending Integration)
An AI/LLM integration project designed to provide conversational financial assistance, automated underwriting insights, and smart product recommendations using local or API-based LLM models.

## Architecture

- **Microservices Deployment**: Both Kubernetes (for heavy, distributed workloads like finCompare) and Docker Compose (for rapid deployment gateways like tezQarza) are utilized.
- **Database**: PostgreSQL is used as the primary relational database across the projects.

## Setup Instructions

To run the entire ecosystem locally, you will need:
- Docker & Docker Compose
- A local Kubernetes cluster (like K3s, Minikube, or Docker Desktop Kubernetes)
- `kubectl` configured
- Node.js & Python (for local development)

Navigate to the respective directories and follow their `README.md` instructions to start the services.
