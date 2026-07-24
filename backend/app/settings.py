from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

from dotenv import find_dotenv

class Settings(BaseSettings):
    # Environment file configs
    model_config = SettingsConfigDict(
        env_file=find_dotenv() or ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Database connection parameters
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres_password@db:5432/TNC-guardian",
        alias="DATABASE_URL"
    )

    # Authentication controls
    JWT_SECRET: str = Field(
        default="your-jwt-secret-key-placeholder",
        alias="JWT_SECRET"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # LLM & AI integrations
    ANTHROPIC_API_KEY: str = Field(
        default="your-anthropic-api-key-placeholder",
        alias="ANTHROPIC_API_KEY"
    )
    OPENAI_API_KEY: str = Field(
        default="your-openai-api-key-placeholder",
        alias="OPENAI_API_KEY"
    )

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

# Instantiate the settings instance
settings = Settings()
