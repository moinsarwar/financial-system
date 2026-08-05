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

### 4. [reseller](./reseller/)
**Reseller (The Comparison Engine)** is a white-labeled dashboard for external agents to view products, submit applications, and track commissions.
- **Tech Stack**: React, FastAPI, PostgreSQL, Docker Compose.
- **Role**: Partner portal for originating applications into finOS.

### 5. [qwenChat](./qwenChat/)
**Comparison Engine** chatbot (qwenChat) is an Ollama-powered read-only assistant for finOS and reseller data, with optional general Q&A.
- **Tech Stack**: React (Vite), FastAPI, Ollama, Docker Compose.
- **Ports**: Frontend `9010`, Backend `9011`.
- **Role**: Streaming chat UI with quick-action tables (GET-only live data) and free-form Qwen chat.

## Setup Instructions

To run the entire ecosystem locally, navigate to the respective directories and follow their `README.md` instructions to start the services (usually via `docker compose up`).
