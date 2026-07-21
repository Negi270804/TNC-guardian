import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.analysis import Analysis, AnalysisItem
from app.schemas.analysis import (
    AnalysisResponse,
    AnalysisItemResponse,
    AnalysisSummaryResponse,
    AnalysisRiskScoreResponse,
)

router = APIRouter()

async def get_verified_document_analysis(
    document_id: uuid.UUID,
    current_user: User,
    db: AsyncSession
) -> Analysis:
    """Helper function to fetch document, verify owner access, and retrieve associated analysis."""
    # 1. Fetch document and validate ownership
    doc_query = select(Document).where(Document.id == document_id)
    doc_res = await db.execute(doc_query)
    doc = doc_res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document's results."
        )

    # 2. Fetch stored analysis
    analysis_query = select(Analysis).where(Analysis.document_id == document_id)
    analysis_res = await db.execute(analysis_query)
    analysis = analysis_res.scalars().first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis has not been generated for this document yet. Please trigger analysis first."
        )

    return analysis

@router.get("/{document_id}", response_model=AnalysisResponse)
async def get_results(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full analysis details including overall score, summary, and all detected clauses."""
    return await get_verified_document_analysis(document_id, current_user, db)

@router.get("/{document_id}/summary", response_model=AnalysisSummaryResponse)
async def get_results_summary(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve ONLY overall summary and AI model info."""
    return await get_verified_document_analysis(document_id, current_user, db)

@router.get("/{document_id}/clauses", response_model=List[AnalysisItemResponse])
async def get_results_clauses(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve ONLY list of detected risk clauses."""
    analysis = await get_verified_document_analysis(document_id, current_user, db)
    return analysis.items

@router.get("/{document_id}/risk-score", response_model=AnalysisRiskScoreResponse)
async def get_results_risk_score(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve ONLY the overall risk score."""
    return await get_verified_document_analysis(document_id, current_user, db)
