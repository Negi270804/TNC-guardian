# Backend Architecture: TNC Guardian

This document defines the backend application architecture for **TNC Guardian**, built using the **FastAPI** web framework, **SQLAlchemy 2.0 ORM**, and **Pydantic v2** validation engines.

---

## 1. Architectural Layout: Layered Architecture Pattern

The backend utilizes a clean, layered service-repository architecture. Each layer has distinct responsibilities, preventing database queries from leaking into API routers or business workflows from leaking into data access layers.

```text
┌────────────────────────────────────────────────────────┐
│                      Client Request                    │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP REST Payload)
                           ▼
┌────────────────────────────────────────────────────────┐
│                        API Layer                       │
│    - API Routers (/api/v1/...)                         │
│    - Pydantic Input Schemas Validation                 │
│    - FastAPI Dependency Injection (Auth, DB session)   │
└──────────────────────────┬─────────────────────────────┘
                           │ (Validated Data Transfer Objects)
                           ▼
┌────────────────────────────────────────────────────────┐
│                      Service Layer                     │
│    - Core Business Logic & Orchestrations              │
│    - Celery Async Task Enqueuing                       │
│    - External Service Integrations (Claude API, S3)    │
└──────────────────────────┬─────────────────────────────┘
                           │ (Domain Data Calls)
                           ▼
┌────────────────────────────────────────────────────────┐
│                    Repository Layer                    │
│    - Database Query Abstraction (CRUD)                 │
│    - SQL Generation & Execution                        │
│    - Session Commit / Rollback Boundaries              │
└──────────────────────────┬─────────────────────────────┘
                           │ (SQL Transactions)
                           ▼
┌────────────────────────────────────────────────────────┐
│                    Database Engine                     │
│    - PostgreSQL Instance (ACID Storage)                │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Responsibilities

The server code resides in `backend/app/`.

*   `api/`: Defines the HTTP entry points.
    *   `v1/`: Version 1 API routers. Each file (e.g. `auth.py`, `analysis.py`) encapsulates routes for a specific feature domain.
    *   `deps.py`: Contains reusable FastAPI dependencies injected using the `Depends()` mechanism:
        *   `get_db`: Yields an asynchronous SQLAlchemy session from the connection pool, closing it automatically upon request completion.
        *   `get_current_user`: Checks incoming authorization headers, verifies the JWT token, fetches user data, and blocks requests if the token is invalid or expired.
*   `core/`: Application settings and base configurations.
    *   `config.py`: Loads configuration settings from environment variables into a type-safe `Settings` class using Pydantic Settings.
    *   `security.py`: Handles cryptography, password hashing (using `passlib` with bcrypt), and JWT creation/validation (using `PyJWT`).
    *   `database.py`: Initializes the asynchronous PostgreSQL engine using `asyncpg` and configures connection pooling parameters (e.g., pool sizes and timeout limits).
    *   `middleware/`: Global interceptors handling CORS filters, rate limiting, and request logging.
*   `models/`: Defines SQLAlchemy declarative tables (e.g. `user.py`, `analysis.py`). These models represent the physical database layout.
*   `schemas/`: Contains Pydantic validation schemas. Pydantic schemas enforce type validation on incoming requests and format outgoing responses, decoupling internal database tables from public API contracts.
*   `repositories/`: Encapsulates database read and write operations. Rather than writing raw SQL in service classes, repositories execute database queries.
*   `services/`: Implements the application's business logic (e.g. orchestrating S3 presigned URLs, scraping terms text, and managing subscriptions).
*   `utils/`: Independent utility modules (e.g. S3 file managers, terms scrapers, and PII scrubbing helpers).
*   `workers/`: Defines Celery task handlers, workers configurations, and asynchronous processing logic (e.g. OCR parser tasks and Whisper audio transcriber tasks).

---

## 3. Concurrency and Async IO Model

The backend leverages FastAPI's asynchronous event loop to handle concurrent workloads efficiently.

*   **API Execution**: Endpoints calling external services (e.g. generating S3 URLs or sending prompts to the Claude API) use `async/await` syntax. When waiting for network responses, FastAPI yields execution back to the event loop, allowing the server to process other incoming requests.
*   **Asynchronous Database Driver**: Database communication is handled asynchronously using SQLAlchemy 2.0 with the `asyncpg` driver. This prevents PostgreSQL queries from blocking the FastAPI event loop during high-traffic periods.
*   **Async Task Queue Isolation**: Computing-intensive tasks (like OCR processing, text extraction from large PDFs, and Whisper transcriptions) are offloaded to background Celery workers. The API routers write a tracking record to PostgreSQL, queue the task in Redis, and return a `202 Accepted` status within milliseconds, preventing API timeouts.

---

## 4. Error Handling and Logging Architecture

*   **Custom Exception Classes**: The service layer raises specific domain exceptions (e.g., `UserNotFoundError`, `QuotaExceededError`) rather than returning HTTP errors directly.
*   **Global Exception Handlers**: Exception handlers are registered at the FastAPI application root. These catch custom domain exceptions and format them into consistent client-facing JSON error payloads with matching HTTP status codes.
*   **Logging Engine**: Configured using standard Python `logging.config` with structured JSON layouts. It captures request execution times, worker task completions, and database transaction failures, writing logs to stdout for aggregation by container orchestration systems.
