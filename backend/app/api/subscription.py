from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.subscription_service import SubscriptionService
from app.config import FREE_PLAN_ANALYSIS_LIMIT
from app import config
from app.schemas.subscription import (
    SubscriptionCurrentResponse,
    SubscriptionPlansResponse,
    SubscriptionUsageResponse,
    UpgradePlanRequest,
    PlanFeatureInfo,
    MonthlyLimits
)
from datetime import datetime, timezone

router = APIRouter()

@router.get("/current", response_model=SubscriptionCurrentResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(current_user.id)
    usage = await sub_service.get_or_create_usage(current_user.id)
    
    remaining = None
    if sub.plan == "FREE":
        remaining = max(0, FREE_PLAN_ANALYSIS_LIMIT - usage.analysis_count)
        
    return SubscriptionCurrentResponse(
        plan=sub.plan,
        status=sub.status,
        expiry_date=sub.renewal_date,
        remaining_analyses=remaining,
        demo_mode=config.DEMO_MODE
    )

@router.get("/plans", response_model=SubscriptionPlansResponse)
async def get_plans(current_user: User = Depends(get_current_user)):
    return SubscriptionPlansResponse(
        plans=[
            PlanFeatureInfo(
                name="FREE",
                price="₹0/month",
                features=[
                    f"{FREE_PLAN_ANALYSIS_LIMIT} AI analyses per month",
                    "Maximum upload size: 5 MB",
                    "Basic OCR",
                    "AI Summary",
                    "Last 10 analyses"
                ]
            ),
            PlanFeatureInfo(
                name="PRO",
                price="₹299/month",
                features=[
                    "Unlimited analyses",
                    "Unlimited history",
                    "Large file uploads (25 MB)",
                    "Advanced OCR",
                    "PDF Export (future ready)",
                    "Priority processing"
                ]
            )
        ]
    )

@router.get("/usage", response_model=SubscriptionUsageResponse)
async def get_current_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(current_user.id)
    usage = await sub_service.get_or_create_usage(current_user.id)
    
    analyses_limit = None
    upload_limit = config.FREE_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024  # default FREE plan limit
    remaining = None
    
    if sub.plan == "FREE":
        analyses_limit = FREE_PLAN_ANALYSIS_LIMIT
        upload_limit = config.FREE_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024
        remaining = max(0, FREE_PLAN_ANALYSIS_LIMIT - usage.analysis_count)
    elif sub.plan == "PRO":
        analyses_limit = None  # Unlimited
        upload_limit = config.PRO_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024  # default PRO plan limit
        remaining = None  # Unlimited
        
    return SubscriptionUsageResponse(
        analysis_count=usage.analysis_count,
        storage_used=usage.storage_used,
        remaining_analyses=remaining,
        monthly_limits=MonthlyLimits(
            analyses=analyses_limit,
            upload_size=upload_limit
        ),
        demo_mode=config.DEMO_MODE
    )

@router.post("/upgrade", response_model=SubscriptionCurrentResponse)
async def upgrade_plan(
    payload: UpgradePlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.plan not in ("FREE", "PRO"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan name. Supported plans: FREE, PRO."
        )
        
    sub_service = SubscriptionService(db)
    sub = await sub_service.upgrade_plan(current_user.id, payload.plan)
    usage = await sub_service.get_or_create_usage(current_user.id)
    
    remaining = None
    if sub.plan == "FREE":
        remaining = max(0, FREE_PLAN_ANALYSIS_LIMIT - usage.analysis_count)
        
    return SubscriptionCurrentResponse(
        plan=sub.plan,
        status=sub.status,
        expiry_date=sub.renewal_date,
        remaining_analyses=remaining,
        demo_mode=config.DEMO_MODE
    )

@router.post("/cancel", response_model=SubscriptionCurrentResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sub_service = SubscriptionService(db)
    sub = await sub_service.cancel_subscription(current_user.id)
    usage = await sub_service.get_or_create_usage(current_user.id)
    
    remaining = None
    if sub.plan == "FREE":
        remaining = max(0, FREE_PLAN_ANALYSIS_LIMIT - usage.analysis_count)
        
    return SubscriptionCurrentResponse(
        plan=sub.plan,
        status=sub.status,
        expiry_date=sub.renewal_date,
        remaining_analyses=remaining,
        demo_mode=config.DEMO_MODE
    )
