import os
import uuid
import time
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, cast, Date, desc, asc

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.analysis import Analysis, AnalysisItem
from app.schemas.analysis import AnalysisResponse
from app.schemas.history import HistoryListResponse, HistoryItemResponse, HistoryDetailResponse
from app.services.ai.factory import AIFactory
from app.services.ai.openai_service import OpenAIService
from app import config

router = APIRouter()

def parse_date(date_str: Optional[str]):
    if not date_str:
        return None
    try:
        from datetime import datetime
        # Strip any time/timezone suffix if present
        cleaned = date_str.split('T')[0]
        return datetime.strptime(cleaned, "%Y-%m-%d").date()
    except Exception:
        return None

def get_risk_level(score: Optional[int]) -> Optional[str]:
    if score is None:
        return None
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    else:
        return "HIGH"

@router.get("", response_model=HistoryListResponse)
async def list_history(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    file_type: Optional[str] = None,
    upload_date: Optional[str] = None,
    analysis_date: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Ensure correct pagination inputs
    if page < 1:
        page = 1
    if limit < 1:
        limit = 10

    # Fetch user subscription to apply history cap on FREE plan
    from app.services.subscription_service import SubscriptionService
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(current_user.id)

    if sub.plan == "FREE" and not config.DEMO_MODE:
        # Find latest 10 document ids
        latest_ids_query = (
            select(Document.id)
            .where(Document.user_id == current_user.id)
            .order_by(Document.created_at.desc())
            .limit(10)
        )
        latest_ids_res = await db.execute(latest_ids_query)
        latest_ids = latest_ids_res.scalars().all()
        if not latest_ids:
            latest_ids = [uuid.uuid4()]  # Non-matching fallback if empty
        
        query = select(Document).outerjoin(Analysis, Document.id == Analysis.document_id).where(Document.id.in_(latest_ids))
        count_query = select(func.count(Document.id)).outerjoin(Analysis, Document.id == Analysis.document_id).where(Document.id.in_(latest_ids))
    else:
        # Base query joining Document and Analysis
        query = select(Document).outerjoin(Analysis, Document.id == Analysis.document_id).where(Document.user_id == current_user.id)
        count_query = select(func.count(Document.id)).outerjoin(Analysis, Document.id == Analysis.document_id).where(Document.user_id == current_user.id)

    # Search filter
    if search:
        search_filter = or_(
            Document.original_filename.ilike(f"%{search}%"),
            Document.file_type.ilike(f"%{search}%"),
            Document.extracted_text.ilike(f"%{search}%"),
            Analysis.summary.ilike(f"%{search}%"),
            Analysis.recommendations.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Risk level filter (LOW, MEDIUM, HIGH mapped to risk score thresholds)
    if risk_level:
        rl = risk_level.upper()
        if rl == "LOW":
            risk_filter = Analysis.overall_risk_score.between(0, 30)
        elif rl == "MEDIUM":
            risk_filter = Analysis.overall_risk_score.between(31, 60)
        elif rl in ("HIGH", "CRITICAL"):
            risk_filter = Analysis.overall_risk_score.between(61, 100)
        else:
            risk_filter = None
            
        if risk_filter is not None:
            query = query.where(risk_filter)
            count_query = count_query.where(risk_filter)

    # File type filter
    if file_type:
        query = query.where(Document.file_type.ilike(file_type))
        count_query = count_query.where(Document.file_type.ilike(file_type))

    # Processing status filter
    if status:
        query = query.where(Document.processing_status.ilike(status))
        count_query = count_query.where(Document.processing_status.ilike(status))

    # Upload date filter
    u_date = parse_date(upload_date)
    if u_date:
        query = query.where(cast(Document.created_at, Date) == u_date)
        count_query = count_query.where(cast(Document.created_at, Date) == u_date)

    # Analysis date filter
    a_date = parse_date(analysis_date)
    if a_date:
        query = query.where(cast(Analysis.created_at, Date) == a_date)
        count_query = count_query.where(cast(Analysis.created_at, Date) == a_date)

    # Calculate total count
    total = await db.scalar(count_query) or 0

    # Sorting
    sort_col = Document.created_at
    if sort_by == "risk_score":
        sort_col = Analysis.overall_risk_score
    elif sort_by == "original_filename" or sort_by == "filename":
        sort_col = Document.original_filename
    elif sort_by == "file_type" or sort_by == "type":
        sort_col = Document.file_type
    elif sort_by == "analysis_date":
        sort_col = Analysis.created_at
    elif sort_by == "upload_date":
        sort_col = Document.created_at

    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    # Pagination offsets
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    res = await db.execute(query)
    documents = res.scalars().all()

    # Build Response Items mapping risk levels
    items = []
    for doc in documents:
        score = doc.analysis.overall_risk_score if doc.analysis else None
        risk_level_str = get_risk_level(score)
        
        # Serialize to dictionary and append risk_level
        item_data = HistoryItemResponse.model_validate(doc).model_dump()
        item_data["risk_level"] = risk_level_str
        items.append(HistoryItemResponse(**item_data))

    import math
    pages = math.ceil(total / limit) if limit > 0 else 1

    return HistoryListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{document_id}", response_model=HistoryDetailResponse)
async def get_history_detail(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch user subscription to enforce history cap on FREE plan
    from app.services.subscription_service import SubscriptionService
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(current_user.id)

    if sub.plan == "FREE" and not config.DEMO_MODE:
        latest_ids_query = (
            select(Document.id)
            .where(Document.user_id == current_user.id)
            .order_by(Document.created_at.desc())
            .limit(10)
        )
        latest_ids_res = await db.execute(latest_ids_query)
        latest_ids = latest_ids_res.scalars().all()
        if document_id not in latest_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to older history records is restricted on the Free plan. Please upgrade to Pro."
            )

    query = select(Document).where(Document.id == document_id)
    res = await db.execute(query)
    doc = res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document history record not found."
        )

    # Auth check
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this history record."
        )

    score = doc.analysis.overall_risk_score if doc.analysis else None
    risk_level_str = get_risk_level(score)

    detail_data = HistoryDetailResponse.model_validate(doc).model_dump()
    detail_data["risk_level"] = risk_level_str
    return HistoryDetailResponse(**detail_data)

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_history_record(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.id == document_id)
    res = await db.execute(query)
    doc = res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document history record not found."
        )

    # Auth check
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this history record."
        )

    # 1. Clean up physical files from disk
    if doc.storage_path and os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
            parent_dir = os.path.dirname(doc.storage_path)
            if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                os.rmdir(parent_dir)
        except Exception as e:
            # Log disk clean up error, but do not block db removal
            print(f"[CLEANUP ERROR] Failed to delete document file: {str(e)}")

    # 2. Database deletion (cascades automatically to Analyses and AnalysisItems due to Cascade constraints)
    await db.delete(doc)
    await db.commit()

    return {"message": "History record and associated files deleted successfully."}

class BulkDeleteRequest(BaseModel):
    document_ids: List[uuid.UUID]

@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_history(
    payload: BulkDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(
        Document.id.in_(payload.document_ids),
        Document.user_id == current_user.id
    )
    res = await db.execute(query)
    docs = res.scalars().all()
    
    if not docs:
        return {"message": "No records found to delete."}
        
    deleted_count = 0
    for doc in docs:
        # Clean up physical files from disk
        if doc.storage_path and os.path.exists(doc.storage_path):
            try:
                os.remove(doc.storage_path)
                parent_dir = os.path.dirname(doc.storage_path)
                if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                    os.rmdir(parent_dir)
            except Exception as e:
                print(f"[CLEANUP ERROR] Failed to delete file: {str(e)}")
        
        # Database deletion (cascades automatically to Analyses and AnalysisItems)
        await db.delete(doc)
        deleted_count += 1
        
    await db.commit()
    return {"message": f"Successfully deleted {deleted_count} records."}

@router.post("/{document_id}/reanalyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def reanalyze_document(
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

    # 3. Delegate to the unified pipeline
    from app.services.analysis_pipeline import run_analysis_pipeline
    analysis = await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        text=doc.extracted_text,
        source_type=doc.source_type or "PDF",
        source_url=doc.source_url,
        existing_document_id=doc.id
    )

    return analysis
