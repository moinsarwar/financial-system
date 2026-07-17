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

### 5. [tezQarza-Gateway](./tezQarza-Gateway/)
**TezQarza-Gateway** is a channel gateway connecting frontend applications with backend financial systems for loan originations and product listing.
- **Tech Stack**: FastAPI, React, PostgreSQL, Docker Compose, Nginx.
- **Role**: API gateway for external agents and dashboard analytics.

## Setup Instructions

To run the entire ecosystem locally, navigate to the respective directories and follow their `README.md` instructions to start the services (usually via `docker compose up`).
