from app.settings import settings

# Global configurations aliases mapping to Pydantic Settings
APP_ENV = settings.APP_ENV
LOG_LEVEL = settings.LOG_LEVEL
BACKEND_HOST = settings.BACKEND_HOST
BACKEND_PORT = settings.BACKEND_PORT
FRONTEND_URL = settings.FRONTEND_URL

DATABASE_URL = settings.DATABASE_URL
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY
OPENAI_API_KEY = settings.OPENAI_API_KEY
GEMINI_API_KEY = settings.GEMINI_API_KEY
OPENAI_MODEL = settings.OPENAI_MODEL
"""Target OpenAI model identifier used for core text analysis."""

OPENAI_TIMEOUT = settings.OPENAI_TIMEOUT
"""Timeout duration limit in seconds for OpenAI HTTP requests."""

OPENAI_MAX_RETRIES = settings.OPENAI_MAX_RETRIES
"""Maximum retry count for transient OpenAI connection or rate-limit failures."""

OPENAI_RETRY_DELAY = settings.OPENAI_RETRY_DELAY
"""Base backoff multiplier delay value in seconds."""

MAX_PROMPT_WORDS = settings.MAX_PROMPT_WORDS
"""Word truncation threshold for the input text passed to LLM prompt context."""

OPENAI_MAX_PROMPT_WORDS = settings.OPENAI_MAX_PROMPT_WORDS
"""Backward-compatible prompt length word limit designation."""

ENABLE_OPENAI = settings.ENABLE_OPENAI
"""Flag indicating if outbound OpenAI API execution is enabled."""

ENABLE_MOCK_FALLBACK = settings.ENABLE_MOCK_FALLBACK
"""Flag indicating if factory should resolve Mock service on missing keys."""

# Reusable exponential backoff retry delays list
OPENAI_RETRY_DELAYS = [0.0, OPENAI_RETRY_DELAY, 5.0]

# Centralized AI logger label constants to avoid duplicated strings
AI_LABEL_PROVIDER = "AI Provider"
AI_LABEL_RETRY = "Retry"
AI_LABEL_TIMEOUT = "Timeout"
AI_LABEL_PROMPT = "Prompt Length"
AI_LABEL_EXEC = "Execution Time"

URL_INGESTION_TIMEOUT = settings.URL_INGESTION_TIMEOUT
URL_INGESTION_RETRIES = settings.URL_INGESTION_RETRIES
URL_INGESTION_MIN_THRESHOLD = settings.URL_INGESTION_MIN_THRESHOLD
FREE_PLAN_ANALYSIS_LIMIT = settings.FREE_PLAN_ANALYSIS_LIMIT
DEMO_MODE = settings.DEMO_MODE

AWS_ACCESS_KEY = settings.AWS_ACCESS_KEY
AWS_SECRET_KEY = settings.AWS_SECRET_KEY
S3_BUCKET = settings.S3_BUCKET

FREE_PLAN_UPLOAD_LIMIT_MB = settings.FREE_PLAN_UPLOAD_LIMIT_MB
PRO_PLAN_UPLOAD_LIMIT_MB = settings.PRO_PLAN_UPLOAD_LIMIT_MB

OCR_USE_GPU = settings.OCR_USE_GPU
OCR_LANGUAGES = settings.OCR_LANGUAGES
ENABLE_IMAGE_OCR = settings.ENABLE_IMAGE_OCR

RATE_LIMIT_LIMIT = settings.RATE_LIMIT_LIMIT
RATE_LIMIT_WINDOW_SECONDS = settings.RATE_LIMIT_WINDOW_SECONDS

# SMTP Configuration mappings
SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USERNAME = settings.SMTP_USERNAME
SMTP_PASSWORD = settings.SMTP_PASSWORD
SMTP_SENDER = settings.SMTP_SENDER
SMTP_FROM_EMAIL = settings.SMTP_FROM_EMAIL
SMTP_USE_TLS = settings.SMTP_USE_TLS

# Resend Email Configuration mappings
RESEND_API_KEY = settings.RESEND_API_KEY
FROM_EMAIL = settings.FROM_EMAIL
