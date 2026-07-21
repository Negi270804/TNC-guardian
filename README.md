# TNC Guardian

> **Understand Terms & Conditions before clicking "I Agree".**

TNC Guardian is an AI-powered SaaS web application designed to help users (students, professionals, freelancers, and small businesses) quickly read, analyze, and comprehend complex Terms & Conditions, Privacy Policies, and End-User License Agreements (EULAs).

The system automates the ingestion of legal documents through URL scraping, PDF text extraction, screenshot OCR processing, and video screen recording transcription, highlighting risks and providing simplified explanations in plain English.

---

## 1. Directory Structure

This project follows a scalable, decoupled client-server repository layout:

```text
tnc-guardian/
├── docker/                    # Dockerfiles for local environments
│   ├── backend/
│   │   └── Dockerfile         # FastAPI Development Docker container config
│   └── frontend/
│       └── Dockerfile         # React Client Development container config
├── docs/                      # Phase 0 Architectural planning documents
├── frontend/                  # React 19 + TypeScript Vite Client SPA
│   ├── src/
│   │   ├── assets/            # Static media resources
│   │   ├── components/        # Global atom UI controls
│   │   ├── config/            # Environment parsing & validators
│   │   ├── context/           # React context engines (UI State)
│   │   ├── hooks/             # Custom utility hooks
│   │   ├── layouts/           # Common views layout grids
│   │   ├── pages/             # Route endpoints matching pages placeholders
│   │   ├── services/          # HTTP request handlers (Axios client)
│   │   ├── styles/            # Tailwind base configuration files
│   │   ├── types/             # Shared TS type definitions
│   │   └── utils/             # Formatters and validators
│   ├── index.html             # Client template portal
│   └── vite.config.ts         # Vite build and path aliasing configuration
├── backend/                   # FastAPI Web server application
│   ├── app/
│   │   ├── api/               # API Router endpoints configurations
│   │   │   └── v1/
│   │   │       └── health.py  # Service health check endpoint
│   │   ├── core/              # Global variables
│   │   ├── db/                # DB initializer scripts
│   │   ├── dependencies/      # FastAPI injection dependencies
│   │   ├── middlewares/       # Inbound HTTP filters
│   │   ├── models/            # SQLAlchemy Database tables mappings
│   │   ├── repositories/      # CRUD queries
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── services/          # Business logics orchestration services
│   │   ├── utils/             # Scrapers and file helpers
│   │   ├── config.py          # Config aliases mapping
│   │   ├── database.py        # Async session configuration setup
│   │   ├── main.py            # API routing entrypoint loader
│   │   └── settings.py        # Pydantic Settings class
│   ├── migrations/            # Alembic migrations history logs
│   ├── alembic.ini            # Alembic migrations driver configurations
│   └── requirements.txt       # Python server packages requirements
├── docker-compose.yml         # Container Orchestration environment file
└── .env.example               # Environmental credentials templates
```

---

## 2. Environment Configurations

Copy the `.env.example` file in the root workspace into a new `.env` file and customize the variables:
```bash
cp .env.example .env
```

Key environment configurations:
*   `DATABASE_URL`: PostgreSQL async connection URL (`postgresql+asyncpg://user:password@host:port/dbname`).
*   `JWT_SECRET`: Signing token secret key.
*   `ANTHROPIC_API_KEY`: API key for Claude 3.5 Sonnet processing.
*   `OPENAI_API_KEY`: API key for Whisper transcription engines.
*   `AWS_ACCESS_KEY` & `AWS_SECRET_KEY`: IAM credentials for AWS S3 upload services.
*   `S3_BUCKET`: Target S3 bucket name.

---

## 3. Installation & Local Development

### Prerequisites
*   Node.js v20+ / npm v10+
*   Python 3.12+
*   Docker & Docker Compose (Optional)

### Running via Docker Compose (Recommended)
Launch the database, Redis broker, backend API server, and React client concurrently:
```bash
docker-compose up --build
```
*   React Frontend: `http://localhost:3000`
*   FastAPI Backend: `http://localhost:8000`
*   Interactive API Docs: `http://localhost:8000/docs`

---

## 4. Manual Local Execution

### Backend API Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Client Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Install packages:
   ```bash
   npm install
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```