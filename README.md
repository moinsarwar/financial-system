# Financial System Monorepo

Welcome to the **Financial System** monorepo. This repository contains the core projects designed to facilitate financial product origination, comparison, backend administration, and core banking/insurance operations within the financial ecosystem.

## Projects Overview

This repository is structured into distinct projects, each serving a specific role:

### 1. [finOS](./finOS/)
**finOS** is the core banking and insurance backend system. It maintains the source of truth for products, clients, applications, holdings, and policies.
- **Tech Stack**: FastAPI, PostgreSQL, Docker Compose.
- **Role**: Core backend system managing financial products, applications, and system of record. 

### 2. [finVault](./finVault/)
**finVault** is the financial application origination platform. It provides a client and administrator interface for initiating, processing, and reviewing applications for various financial products (loans, insurance, bank accounts).
- **Tech Stack**: React (Vite), FastAPI, PostgreSQL, Docker Compose.
- **Role**: Application origination, tracking application lifecycles, and managing user interaction.

### 3. [adminPortal](./adminPortal/)
**adminPortal** is a centralized administrative dashboard for managing the financial ecosystem.
- **Role**: Provides admin capabilities across the financial system microservices.

### 4. [finCompare](./finCompare/)
**finCompare** is a microservices-based platform built to aggregate, analyze, and compare financial products from various banks and institutions. 
- **Tech Stack**: FastAPI, Node.js/React, PostgreSQL, Redis, Kubernetes (K3s), Docker.
- **Role**: Core comparison engine, policy ingestion, audit logging, and external product aggregation.

### 5. [reseller](./reseller/)
**Reseller (The Comparison Engine)** is a white-labeled dashboard for external agents to view products, submit applications, and track commissions.
- **Tech Stack**: React, FastAPI, PostgreSQL, Docker Compose.
- **Role**: Partner portal for originating applications into finOS.


### 6. [tezQarza-Gateway](./tezQarza-Gateway/)
**TezQarza-Gateway** is a channel gateway connecting frontend applications with backend financial systems for loan originations and product listing.
- **Tech Stack**: FastAPI, React, PostgreSQL, Docker Compose, Nginx.
- **Role**: API gateway for external agents and dashboard analytics.

### 7. [qwenChat](./qwenChat/)
**QwenChat** is a professional Ollama-powered chatbot for exploring finOS and reseller data in read-only mode.
- **Tech Stack**: React (Vite), FastAPI, Ollama (`qwen2.5:0.5b`), Docker Compose.
- **Ports**: Frontend `9010`, Backend `9011`.
- **Role**: Streaming chat UI with quick-action buttons that GET live marketplace, applications, clients, resellers, and commission data (no writes).

## Setup Instructions

To run the entire ecosystem locally, navigate to the respective directories and follow their `README.md` instructions to start the services (usually via `docker compose up`).
