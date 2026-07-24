import sys
import uuid
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine.url import make_url
from sqlalchemy import text
from app.config import DATABASE_URL

logger = logging.getLogger("app.database")

# Create async engine linked to asyncpg driver
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
)

# Create session maker session class
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Standard base models mapper
Base = declarative_base()

# Async DB session dependency provider
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def mask_database_url(url: str) -> str:
    """Masks database passwords to prevent sensitive credentials leaks in logs."""
    try:
        parsed = make_url(url)
        return f"{parsed.drivername}://{parsed.username}:*****@{parsed.host}:{parsed.port}/{parsed.database}"
    except Exception:
        return "Invalid DATABASE_URL connection string format."

async def test_db_connection() -> bool:
    """Startup diagnostic helper testing PostgreSQL connection and routing parameters."""
    masked_url = mask_database_url(DATABASE_URL)
    logger.info(f"[DB DIAGNOSTICS] Resolved DATABASE_URL: {masked_url}")

    # Inspect for Docker-specific hostnames when running outside containers
    for host in ["db", "postgres", "database"]:
        if f"@{host}:" in DATABASE_URL or f"@{host}/" in DATABASE_URL:
            logger.warning(
                f"[DB DIAGNOSTICS] Using Docker-specific hostname '{host}' while running locally. "
                "This will fail database routing. Replace with localhost or 127.0.0.1 inside your local .env configuration."
            )

    try:
        # Establish asyncpg testing transaction
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("[DB DIAGNOSTICS] Connection check successful! Database is online and reachable.")
            return True
    except Exception as e:
        logger.error("[DB DIAGNOSTICS] Database connection check failed!")
        logger.error(f"[DB DIAGNOSTICS] System traceback details: {str(e)}")

        err_msg = str(e).lower()
        if "getaddrinfo failed" in err_msg or "cannot route" in err_msg:
            logger.error(
                "[DB DIAGNOSTICS] EXPLANATION: Hostname resolution failure. The server cannot locate the Postgres host. "
                "Ensure target host resolves to localhost, 127.0.0.1, or a valid active endpoint."
            )
        elif "password authentication failed" in err_msg or "credential" in err_msg:
            logger.error(
                "[DB DIAGNOSTICS] EXPLANATION: Password verification failure. The database password is incorrect. "
                "Double check the password string inside your .env settings."
            )
        elif "does not exist" in err_msg:
            logger.error(
                "[DB DIAGNOSTICS] EXPLANATION: Database target name does not exist. Connect to PostgreSQL server manually "
                "and execute: 'CREATE DATABASE tnc_guardian;'"
            )
        elif "connection refused" in err_msg or "is not accepting connections" in err_msg:
            logger.error(
                "[DB DIAGNOSTICS] EXPLANATION: Network connection refused. Ensure target PostgreSQL service is running "
                "locally and listening on the designated port (default: 5432)."
            )
        else:
            logger.error(
                "[DB DIAGNOSTICS] EXPLANATION: Unhandled system error. Verify firewall constraints and Postgres configuration permissions."
            )
        return False
