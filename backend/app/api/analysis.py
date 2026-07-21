import uuid
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.analysis import Analysis, AnalysisItem
from app.schemas.analysis import AnalysisResponse
from app.services.ai.factory import AIFactory
from app.services.ai.openai_service import OpenAIService

router = APIRouter()

@router.post("/{document_id}", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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
            detail="You do not have permission to access this document."
        )

    # 2. Check if text is extracted
    if not doc.text_extracted or not doc.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text has not been extracted from this document yet. Please extract text first."
        )

    # 3. Clean up any existing analysis for this document to avoid conflict
    exist_query = select(Analysis).where(Analysis.document_id == document_id)
    exist_res = await db.execute(exist_query)
    existing_analysis = exist_res.scalars().first()
    if existing_analysis:
        await db.delete(existing_analysis)
        await db.commit()

    # 4. Resolve AI Service and execute analysis, tracking time
    ai_service = AIFactory.get_service()
    
    start_time = time.time()
    try:
        result = await ai_service.analyze(doc.extracted_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Auditor failed to process text content: {str(e)}"
        )
    processing_time = round(time.time() - start_time, 2)

    # 5. Determine engine details
    provider_name = "openai" if isinstance(ai_service, OpenAIService) else "mock"
    model_name = "gpt-4o-mini" if isinstance(ai_service, OpenAIService) else "mock-v1"

    # 6. Save Analysis header
    analysis = Analysis(
        document_id=document_id,
        overall_risk_score=result["overall_risk_score"],
        summary=result["summary"],
        recommendations=result["recommendations"],
        processing_time=processing_time,
        provider=provider_name,
        model_name=model_name
    )

    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    # 7. Save Analysis Items (Flagged Risk clauses)
    for item in result.get("items", []):
        clause_item = AnalysisItem(
            analysis_id=analysis.id,
            title=item["title"],
            category=item["category"],
            risk_level=item["risk_level"],
            explanation=item["explanation"],
            original_text=item["original_text"],
            suggestion=item["suggestion"]
        )
        db.add(clause_item)

    await db.commit()
    await db.refresh(analysis)
    return analysis

@router.get("/{document_id}", response_model=AnalysisResponse)
async def get_document_analysis(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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
            detail="You do not have permission to access this document."
        )

    # 2. Fetch stored analysis
    analysis_query = select(Analysis).where(Analysis.document_id == document_id)
    analysis_res = await db.execute(analysis_query)
    analysis = analysis_res.scalars().first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis has not been generated for this document yet. Trigger analysis first."
        )

    return analysis
