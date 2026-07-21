from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.health import router as health_router
from app.api.auth import router as auth_router
from app.database import test_db_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute database connectivity diagnostics on startup
    await test_db_connection()
    yield

app = FastAPI(
    title="TNC Guardian API",
    description="API configurations for TNC Guardian Terms & Conditions analysis service.",
    version="1.0.0",
    lifespan=lifespan
)

# Set global CORS rules to interface with client applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict origins in production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database error interceptor to clean up traceback outputs
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    err_msg = str(exc).lower()
    friendly_msg = "A database connectivity error occurred. Please try again later."
    
    if "getaddrinfo failed" in err_msg or "cannot route" in err_msg:
        friendly_msg = (
            "Database connection failed: The database host could not be resolved. "
            "Verify network routing or Docker configuration settings."
        )
    elif "password authentication failed" in err_msg or "credential" in err_msg:
        friendly_msg = (
            "Database connection failed: Username/password verification failed. "
            "Please check credentials parameters."
        )
    elif "connection refused" in err_msg or "is not accepting connections" in err_msg:
        friendly_msg = (
            "Database connection failed: PostgreSQL server connection refused. "
            "Verify that PostgreSQL server is online and listening on target port."
        )
    elif "does not exist" in err_msg:
        friendly_msg = (
            "Database connection failed: The database does not exist. "
            "Ensure the database 'tnc_guardian' is created on the server."
        )
    
    # Extract original connection details if nested
    orig_detail = str(exc.__dict__.get('orig', exc))
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "error_code": "DATABASE_CONNECTIVITY_ERROR",
                "message": friendly_msg,
                "system_detail": orig_detail
            }
        }
    )

# Include core routes
app.include_router(health_router, prefix="/api/v1", tags=["Health Checks"])
app.include_router(auth_router, prefix="/api/auth", tags=["User Authentication"])

@app.get("/")
def read_root():
    return {
        "service": "TNC Guardian API Server",
        "status": "online",
        "documentation": "/docs"
    }
