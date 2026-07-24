import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator, ValidationError
from dotenv import find_dotenv

class Settings(BaseSettings):
    # Environment file configs
    model_config = SettingsConfigDict(
        env_file=find_dotenv() or ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Environment descriptor
    APP_ENV: str = Field(default="development", alias="APP_ENV")
    LOG_LEVEL: str = Field(default="INFO", alias="LOG_LEVEL")
    BACKEND_HOST: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    BACKEND_PORT: int = Field(default=8000, alias="BACKEND_PORT")

    # Database connection parameters (Required: no defaults in code)
    DATABASE_URL: str = Field(min_length=1, alias="DATABASE_URL")

    # Authentication controls (Required: no defaults in code)
    JWT_SECRET: str = Field(min_length=1, alias="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", alias="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # LLM & AI integrations
    ANTHROPIC_API_KEY: str = Field(
        default="your-anthropic-api-key-placeholder",
        alias="ANTHROPIC_API_KEY"
    )
    OPENAI_API_KEY: str = Field(
        default="your-openai-api-key-placeholder",
        alias="OPENAI_API_KEY"
    )
    GEMINI_API_KEY: str = Field(
        default="your-gemini-api-key-placeholder",
        alias="GEMINI_API_KEY"
    )
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")

    URL_INGESTION_TIMEOUT: float = Field(default=12.0, alias="URL_INGESTION_TIMEOUT")
    URL_INGESTION_RETRIES: int = Field(default=3, alias="URL_INGESTION_RETRIES")
    URL_INGESTION_MIN_THRESHOLD: int = Field(default=200, alias="URL_INGESTION_MIN_THRESHOLD")
    FREE_PLAN_ANALYSIS_LIMIT: int = Field(default=10, alias="FREE_PLAN_ANALYSIS_LIMIT")
    DEMO_MODE: bool = Field(default=True, alias="DEMO_MODE")

    # AWS Storage integrations
    AWS_ACCESS_KEY: str = Field(
        default="your-aws-access-key-placeholder",
        alias="AWS_ACCESS_KEY"
    )
    AWS_SECRET_KEY: str = Field(
        default="your-aws-secret-key-placeholder",
        alias="AWS_SECRET_KEY"
    )
    S3_BUCKET: str = Field(
        default="tnc-guardian-uploads",
        alias="S3_BUCKET"
    )

    # CORS settings
    CORS_ORIGINS: str = Field(
        default="*",
        alias="CORS_ORIGINS"
    )

    # File Upload size limits (in MB)
    FREE_PLAN_UPLOAD_LIMIT_MB: int = Field(default=5, alias="FREE_PLAN_UPLOAD_LIMIT_MB")
    PRO_PLAN_UPLOAD_LIMIT_MB: int = Field(default=25, alias="PRO_PLAN_UPLOAD_LIMIT_MB")

    # OCR Settings
    OCR_USE_GPU: bool = Field(default=True, alias="OCR_USE_GPU")
    OCR_LANGUAGES: str = Field(default="en", alias="OCR_LANGUAGES")

    # Rate Limiting Settings
    RATE_LIMIT_LIMIT: int = Field(default=15, alias="RATE_LIMIT_LIMIT")
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, alias="RATE_LIMIT_WINDOW_SECONDS")

    @model_validator(mode="after")
    def validate_production_config(self) -> 'Settings':
        if self.APP_ENV == "production":
            if not self.DATABASE_URL or "postgres_password" in self.DATABASE_URL or "your_postgres_password" in self.DATABASE_URL:
                raise ValueError("DATABASE_URL is using default credentials or is missing in production mode.")
            if not self.JWT_SECRET or "placeholder" in self.JWT_SECRET.lower() or "generate_a_secure_jwt" in self.JWT_SECRET.lower():
                raise ValueError("JWT_SECRET is using a default or placeholder value in production mode.")
        return self

# Instantiate settings and handle validation errors gracefully at startup
try:
    settings = Settings()
except ValidationError as e:
    print("\n" + "="*80, file=sys.stderr)
    print("CRITICAL CONFIGURATION ERROR: Backend failed to start due to missing or invalid environment variables.", file=sys.stderr)
    print("="*80, file=sys.stderr)
    for err in e.errors():
        loc = ".".join(str(l) for l in err["loc"])
        print(f" - {loc}: {err['msg']}", file=sys.stderr)
    print("\nPlease set these in your .env file or environment variables.", file=sys.stderr)
    print("="*80 + "\n", file=sys.stderr)
    sys.exit(1)
