# Scalable Enterprise Folder Structure: TNC Guardian

This document defines the production-grade directory layout for the **TNC Guardian** application. It isolates concerns, separates environments, supports automated testing, and scales cleanly as features are added.

---

## 1. Overview Layout
```text
tnc-guardian/
├── .github/                   # CI/CD Workflows (GitHub Actions)
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
├── assets/                    # Shared global assets (brand logos, design specs)
│   ├── branding/
│   └── mockups/
├── config/                    # Shared global configurations
│   ├── env/
│   │   ├── .env.development
│   │   ├── .env.staging
│   │   └── .env.production
│   └── prometheus/            # Monitoring configuration rules
│       └── prometheus.yml
├── docker/                    # Multi-container orchestrations & Dockerfiles
│   ├── docker-compose.yml     # Local multi-container development environment
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   ├── frontend/
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   ├── nginx/
│   │   └── nginx.conf
│   └── workers/
│       └── Dockerfile
├── docs/                      # Phase 0 Architecture and Product Documentation
│   ├── PROJECT_SPEC.md
│   ├── TECH_STACK.md
│   ├── FOLDER_STRUCTURE.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DESIGN.md
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── BACKEND_ARCHITECTURE.md
│   ├── USER_FLOW.md
│   └── DEVELOPMENT_ROADMAP.md
├── frontend/                  # React + TypeScript + Vite Client App
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                   # FastAPI Web App & Async Workers
│   ├── app/
│   ├── migrations/            # Alembic Database Migrations
│   ├── requirements.txt
│   ├── alembic.ini
│   └── run.py
├── scripts/                   # Operations, orchestration, & automation scripts
│   ├── setup.sh
│   ├── db-seed.py
│   └── run-tests.sh
└── tests/                     # Multi-layer integration and E2E test suites
    ├── e2e/
    └── performance/
```

---

## 2. Detailed Subdirectory Breakdowns

### A. Frontend (`frontend/src/`)
The frontend is organized around feature modules (domain-driven design) alongside core shared items.
```text
frontend/src/
├── assets/                    # Local component images, styles, and font vectors
│   ├── fonts/
│   └── images/
├── components/                # Global re-usable presentation components (UI library)
│   ├── ui/                    # Base atoms: Button, Input, Modal, Table, Dropdown
│   ├── feedback/              # Spinner, Alert, ProgressBar, Toast
│   └── layout/                # Footer, Navbar, Sidebar
├── config/                    # Constant values and global environment configs
│   ├── constants.ts
│   └── env.ts
├── contexts/                  # React Contexts for global client-only states
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── features/                  # Domain modules (Self-contained logic blocks)
│   ├── auth/                  # Login, Register, ForgetPassword components & hooks
│   ├── dashboard/             # Main dashboard visual panels
│   ├── analysis/              # Document uploaders, URL paste inputs, progress trackers
│   ├── history/               # History listing table, comparison view
│   ├── results/               # Simplification view, risk score gauge, recommendation cards
│   └── profile/               # Billing preferences, limits widget, account form
├── hooks/                     # Custom global React hooks
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── layouts/                   # Structural wrapper layouts for page structures
│   ├── AppLayout.tsx          # Authed: Navbar + Sidebar + Main viewport
│   └── AuthLayout.tsx         # Unauthed: Split-screen branding + auth form
├── pages/                     # Routed view page entries (mapping 1:1 with router setup)
│   ├── LandingPage.tsx
│   ├── DashboardPage.tsx
│   └── NotFoundPage.tsx
├── routes/                    # Router configuration configurations
│   ├── AppRoutes.tsx
│   └── ProtectedRoute.tsx
├── services/                  # Network API layers and external integrations
│   ├── api-client.ts          # Axios / Fetch client instance with JWT interceptors
│   ├── analysis-service.ts
│   └── auth-service.ts
├── types/                     # Shared TypeScript type interfaces and declarations
│   ├── analysis.d.ts
│   └── user.d.ts
├── utils/                     # Formatters, checkers, validators
│   ├── date.ts
│   └── validators.ts
├── App.tsx                    # React Root Component
└── main.tsx                   # DOM Mount Entry Point
```

---

### B. Backend (`backend/app/`)
The backend relies on a layered service-repository structure, separating routing HTTP logic from DB operations.
```text
backend/app/
├── api/                       # API Route definitions (FastAPI routers)
│   ├── v1/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── analysis.py
│   │   ├── billing.py
│   │   └── api.py             # Router entry combining all routes
│   └── deps.py                # FastAPI dependency injection helpers (get_db, get_current_user)
├── core/                      # Global engine setup, setups, and middlewares
│   ├── config.py              # Environment configuration loader using Pydantic Settings
│   ├── security.py            # Password hashing, JWT creation & validation
│   ├── database.py            # SQLAlchemy async engine, sessionmaker, and Base model
│   └── middleware/            # CORS, rate limiting, and execution timing logging
├── models/                    # SQLAlchemy declarative tables (Database entities)
│   ├── user.py
│   ├── analysis.py
│   ├── file.py
│   └── billing.py
├── schemas/                   # Pydantic validation schemas (DTOs)
│   ├── user.py
│   ├── analysis.py
│   ├── file.py
│   └── billing.py
├── repositories/              # Database read/write logic isolation
│   ├── base.py
│   ├── user_repository.py
│   └── analysis_repository.py
├── services/                  # Business logic services
│   ├── analysis_service.py    # Directs orchestrations (S3 URL generation, LLM prompting)
│   ├── ocr_service.py         # Interfaces with Tesseract parser
│   ├── speech_service.py      # Interfaces with Whisper transcriber
│   └── billing_service.py     # Subscriptions management
├── utils/                     # Standalone helper functions
│   ├── s3.py                  # AWS S3 upload/download bucket helpers
│   ├── scraper.py             # Web URL terms fetcher
│   └── text_cleaner.py        # Legal document scrubbing tools
├── workers/                   # Async distributed task logic configurations
│   ├── celery_app.py          # Celery configuration setup
│   └── tasks.py               # Long-running async task routines (OCR, Whisper)
├── tests/                     # Backend Unit and Integration tests
│   ├── conftest.py            # Pytest DB and client fixture mappings
│   ├── api/
│   ├── services/
│   └── workers/
├── main.py                    # FastAPI application initialization entry
└── worker-run.py              # Celery worker application execution runner
```

---

## 3. Directory Responsibilities and Constraints
*   **Separation of Concerns**: Frontend and backend are completely decoupled. The frontend communicates with the backend exclusively via REST APIs.
*   **Domain Isolation in Feature Folders**: Frontend features include their own API requests, local utility components, and custom state, minimizing code ripple effects when editing feature logic.
*   **Decoupled Async Tasks**: Code within `backend/app/workers/` contains the actual processing code executed by Celery. The REST API merely queues these tasks and returns task IDs immediately, ensuring high response speeds.
*   **Single Source of Truth Configs**: Environment variables reside in the `config/env/` folder, which is loaded at launch by both frontend (Vite config loading) and backend (Pydantic settings loading).
