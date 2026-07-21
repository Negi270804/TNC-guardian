# Technical Stack Specification: TNC Guardian

This document outlines the technology stack selected for **TNC Guardian**, providing technical details and architectural rationales for each component.

---

## 1. Frontend

### Tech Stack Components
*   **Core Library**: React 18+ (Functional Components with Hooks)
*   **Language**: TypeScript (Strict Mode enabled)
*   **Build Tool & Dev Server**: Vite
*   **Styling**: Tailwind CSS v3+
*   **Routing**: React Router v6
*   **Data Fetching & State Synchronization**: TanStack Query (React Query) v5

### Selection Rationale
*   **React & TypeScript**: React provides a component-driven declarative model that fits the dynamic dashboard of TNC Guardian. TypeScript adds compile-time type safety for complex API contracts, preventing runtime crashes when handling multi-nested risk structures returned by the backend.
*   **Vite**: Replaces traditional Webpack configurations, offering near-instantaneous Hot Module Replacement (HMR) and optimized rollup production bundles. This accelerates development feedback loops and ensures fast client-side loading times.
*   **Tailwind CSS**: Offers utility-first CSS styling that keeps production style bundles small and allows for rapid, consistent layout creation without standard stylesheet bloat. It ensures full responsiveness across mobile, tablet, and desktop screens.
*   **React Router**: The standard routing solution for SPA applications in React. It enables client-side nested routing, protection of private dashboard paths, and lazy-loading of pages to optimize performance.
*   **TanStack Query**: Abstracting the network state via React Query eliminates the need for manual loading/error state management or heavy global state tools (like Redux) for server state. It provides built-in client-side caching, request deduplication, background updates, and automatic retries for documents processing asynchronously.

---

## 2. Backend

### Tech Stack Components
*   **Web Framework**: FastAPI (Python)
*   **Object-Relational Mapping (ORM)**: SQLAlchemy 2.0 (Asynchronous Driver)
*   **Database Migrations**: Alembic
*   **Data Validation & Serialization**: Pydantic v2
*   **Authentication & Security**: JWT (JSON Web Tokens) with PyJWT or python-jose

### Selection Rationale
*   **FastAPI**: A high-performance Python framework built on top of Starlette and Pydantic. It provides native support for `async/await` syntax, permitting parallel non-blocking execution of network requests to external APIs (Claude API) or storage systems (S3). Automatic interactive documentation (Swagger UI/ReDoc) speeds up frontend-backend API integration.
*   **SQLAlchemy 2.0**: Provides full async compatibility, letting the backend handle hundreds of concurrent requests without blocking execution threads on long-running database transactions.
*   **Pydantic v2**: Re-written in Rust, Pydantic v2 is up to 20x faster than v1. It handles input validation, runtime data enforcement, and output serialization seamlessly, generating OpenAPI schemas automatically.
*   **JWT Authentication**: A stateless security mechanism allowing the backend to remain horizontal and scale across multiple server instances without relying on shared session stores.

---

## 3. Database

### Tech Stack Components
*   **Engine**: PostgreSQL 15+ (Relational Database)
*   **Connection Pooler**: PgBouncer (For connection conservation under high traffic)

### Selection Rationale
*   **PostgreSQL**: A mature, ACID-compliant relational database. It is selected due to its advanced support for:
    *   **JSONB data types**: This is critical for storing LLM risk assessment payloads, allowing rich query parameters over raw JSON outputs without rigid column re-definitions.
    *   **Relational integrity**: Ensures precise data relationships between users, subscription plans, tracking credits, uploaded files, and historical logs.
    *   **Indexes**: Supports B-tree indexing on user credentials/foreign keys, and GIN indexing on nested JSON fields for performance optimization during search operations.

---

## 4. Artificial Intelligence (AI)

### Tech Stack Components
*   **LLM Provider**: Anthropic Claude API (Claude 3.5 Sonnet / Haiku)
*   **Integration Layer**: LangChain or LiteLLM (Independent adapter layer)

### Selection Rationale
*   **Anthropic Claude**: Claude 3.5 Sonnet is selected for its leading performance in legal document analysis, long context-window support (up to 200k tokens to handle entire enterprise contracts in a single query), and exceptional reasoning capabilities regarding nuance, logical deductions, and policy definitions.
*   **Provider Independence**: All AI prompts and orchestration calls run through an abstract adapter layer (e.g., using LiteLLM or a custom service class interface). This enables the system to pivot to other models (such as OpenAI GPT-4o, Google Gemini Pro, or self-hosted Llama-3) by simply updating environment variables, without requiring changes to backend business logic.

---

## 5. Optical Character Recognition (OCR)

### Tech Stack Components
*   **OCR Engine**: Tesseract OCR (Wrapper: pytesseract)

### Selection Rationale
*   **Tesseract OCR**: A highly accurate, widely adopted open-source OCR engine. When running screenshot scans, Tesseract extracts text patterns layout-by-layout. By utilizing pre-processing scripts (converting to grayscale, thresholding, and removing borders with OpenCV), we ensure high accuracy for screenshot text without incurring per-page third-party OCR API charges.

---

## 6. Speech Recognition

### Tech Stack Components
*   **Speech-to-Text Engine**: OpenAI Whisper (Local runner via `whisper-timestamped` or Hugging Face Transformers wrapper)

### Selection Rationale
*   **Whisper**: Provides state-of-the-art transcription for multi-lingual spoken narration. Since users may upload screen recordings explaining legal forms or speaking during video walkthroughs, Whisper extracts the audio stream and translates spoken content into structured text. Using local or containerized Whisper models avoids high usage fees associated with external speech APIs.

---

## 7. Cloud Storage

### Tech Stack Components
*   **Object Storage**: AWS S3 (Simple Storage Service)

### Selection Rationale
*   **AWS S3**: Highly durable, secure, and infinitely scalable storage for user uploads (PDFs, images, and videos). Using AWS S3 allows the backend to generate **Presigned URLs** for secure direct-client uploads. This bypasses the backend server during file uploads, saving bandwidth, memory, and CPU resources.

---

## 8. Deployment & Infrastructure

### Tech Stack Components
*   **Containerization**: Docker
*   **Orchestration & Hosting**: AWS App Runner
*   **Message Broker & Task Queue**: Redis + Celery (For async task queues like OCR and transcription)

### Selection Rationale
*   **Docker**: Ensures identical runtime environments across local development, testing, staging, and production environments, eliminating "it works on my machine" issues.
*   **AWS App Runner**: A fully managed container application service. It automatically builds and deploys containers from source repositories or Docker registries, handles load balancing, traffic routing, scaling out under load, and scales down to zero when idle, minimizing infrastructure management overhead.
*   **Redis + Celery**: High-throughput queues needed to offload resource-intensive tasks (OCR processing, Whisper transcription, and large LLM queries) from the main API thread, keeping frontend responses fast and reliable.
