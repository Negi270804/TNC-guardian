import uuid
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisResponse
from app.services.analysis_pipeline import run_analysis_pipeline
from app.services.url_extractor import URLExtractorService

class SimpleRateLimiter:
    def __init__(self, limit: int = 10, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    async def __call__(self, current_user: User = Depends(get_current_user)):
        user_id = str(current_user.id)
        now = time.time()
        
        user_history = self.history[user_id]
        # Clean older requests from window
        self.history[user_id] = [t for t in user_history if now - t < self.window_seconds]
        
        if len(self.history[user_id]) >= self.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum of {self.limit} analyses per {self.window_seconds} seconds."
            )
            
        self.history[user_id].append(now)

# Limit to 15 requests per 60 seconds
analysis_limiter = SimpleRateLimiter(limit=15, window_seconds=60)

router = APIRouter()

class PDFAnalysisRequest(BaseModel):
    document_id: uuid.UUID

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=100, max_length=150000)

class URLAnalysisRequest(BaseModel):
    url: str

@router.post("/pdf", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(analysis_limiter)])
async def analyze_pdf(
    payload: PDFAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint to trigger analysis on an already uploaded PDF document.
    """
    # Fetch the document to get the extracted text
    doc_query = select(Document).where(Document.id == payload.document_id)
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

    if not doc.text_extracted or not doc.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text has not been extracted from this document yet. Please extract text first."
        )

    return await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        text=doc.extracted_text,
        source_type="PDF",
        existing_document_id=payload.document_id
    )

@router.post("/text", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(analysis_limiter)])
async def analyze_text(
    payload: TextAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint to analyze raw pasted legal text.
    """
    if len(payload.text.strip()) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text too short"
        )

    return await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        text=payload.text,
        source_type="TEXT"
    )

@router.post("/url", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(analysis_limiter)])
async def analyze_url(
    payload: URLAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint to crawl a T&C URL and analyze its readable text.
    """
    # 1. Fetch and extract text content from the URL (includes SSRF check)
    clean_text = await URLExtractorService.fetch_and_clean_url(payload.url)
    
    # 2. Run clean text through common pipeline
    return await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        text=clean_text,
        source_type="URL",
        source_url=payload.url
    )

@router.post("/{document_id}", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(analysis_limiter)])
async def analyze_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Backwards compatible endpoint to trigger analysis on document_id path parameter.
    """
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

    if not doc.text_extracted or not doc.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text has not been extracted from this document yet. Please extract text first."
        )

    return await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        text=doc.extracted_text,
        source_type="PDF",
        existing_document_id=document_id
    )

@router.get("/{document_id}", response_model=AnalysisResponse)
async def get_document_analysis(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve saved analysis for a document.
    """
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
