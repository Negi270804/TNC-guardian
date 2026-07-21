from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.health import router as health_router

app = FastAPI(
    title="TNC Guardian API",
    description="API configurations for TNC Guardian Terms & Conditions analysis service.",
    version="1.0.0",
)

# Set global CORS rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict origins in production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routes
app.include_router(health_router, prefix="/api/v1", tags=["Health Checks"])

@app.get("/")
def read_root():
    return {
        "service": "TNC Guardian API Server",
        "status": "online",
        "documentation": "/docs"
    }
