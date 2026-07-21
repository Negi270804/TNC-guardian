from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Validate PostgreSQL session query execution
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "TNC Guardian api service is boot ready."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection check failure: {str(e)}"
        )
