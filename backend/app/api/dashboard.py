import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.analysis import Analysis
from app.services.subscription_service import SubscriptionService
from app.schemas.history import HistoryItemResponse
from app.config import FREE_PLAN_ANALYSIS_LIMIT

router = APIRouter()

class UsageStats(BaseModel):
    analysis_count: int
    limit: Optional[int] = None
    plan: str

class DashboardStatsResponse(BaseModel):
    total_analyses: int
    pdf_count: int
    text_count: int
    url_count: int
    average_risk_score: float
    recent_activity: List[HistoryItemResponse]
    usage_statistics: UsageStats

def get_risk_level(score: Optional[int]) -> Optional[str]:
    if score is None:
        return None
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    else:
        return "HIGH"

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch source type counts
    pdf_q = select(func.count(Document.id)).outerjoin(Analysis, Document.id == Analysis.document_id).where(
        Document.user_id == current_user.id,
        or_(Document.source_type == 'PDF', Document.source_type == None),
        Analysis.id != None
    )
    text_q = select(func.count(Document.id)).outerjoin(Analysis, Document.id == Analysis.document_id).where(
        Document.user_id == current_user.id,
        Document.source_type == 'TEXT',
        Analysis.id != None
    )
    url_q = select(func.count(Document.id)).outerjoin(Analysis, Document.id == Analysis.document_id).where(
        Document.user_id == current_user.id,
        Document.source_type == 'URL',
        Analysis.id != None
    )

    pdf_count = await db.scalar(pdf_q) or 0
    text_count = await db.scalar(text_q) or 0
    url_count = await db.scalar(url_q) or 0
    total_analyses = pdf_count + text_count + url_count

    # 2. Average Risk Score
    avg_q = select(func.avg(Analysis.overall_risk_score)).join(Document, Document.id == Analysis.document_id).where(
        Document.user_id == current_user.id
    )
    avg_risk = await db.scalar(avg_q)
    average_risk_score = round(float(avg_risk), 1) if avg_risk is not None else 0.0

    # 3. Recent Activity (last 5 analyzed documents)
    recent_q = (
        select(Document)
        .outerjoin(Analysis, Document.id == Analysis.document_id)
        .where(
            Document.user_id == current_user.id,
            Analysis.id != None
        )
        .order_by(Document.created_at.desc())
        .limit(5)
    )
    recent_res = await db.execute(recent_q)
    recent_docs = recent_res.scalars().all()

    recent_activity = []
    for doc in recent_docs:
        score = doc.analysis.overall_risk_score if doc.analysis else None
        risk_level_str = get_risk_level(score)
        
        item_data = HistoryItemResponse.model_validate(doc).model_dump()
        item_data["risk_level"] = risk_level_str
        recent_activity.append(HistoryItemResponse(**item_data))

    # 4. Usage statistics
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(current_user.id)
    usage = await sub_service.get_or_create_usage(current_user.id)

    analyses_limit = FREE_PLAN_ANALYSIS_LIMIT if sub.plan == "FREE" else None

    return DashboardStatsResponse(
        total_analyses=total_analyses,
        pdf_count=pdf_count,
        text_count=text_count,
        url_count=url_count,
        average_risk_score=average_risk_score,
        recent_activity=recent_activity,
        usage_statistics=UsageStats(
            analysis_count=usage.analysis_count,
            limit=analyses_limit,
            plan=sub.plan
        )
    )
