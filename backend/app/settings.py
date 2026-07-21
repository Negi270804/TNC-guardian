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

# Instantiate the settings instance
settings = Settings()
