from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SubscriptionCurrentResponse(BaseModel):
    plan: str
    status: str
    expiry_date: Optional[datetime] = None
    remaining_analyses: Optional[int] = None

class PlanFeatureInfo(BaseModel):
    name: str
    price: str
    features: List[str]

class SubscriptionPlansResponse(BaseModel):
    plans: List[PlanFeatureInfo]

class MonthlyLimits(BaseModel):
    analyses: Optional[int] = None  # null means unlimited
    upload_size: int  # in bytes

class SubscriptionUsageResponse(BaseModel):
    analysis_count: int
    storage_used: int
    remaining_analyses: Optional[int] = None
    monthly_limits: MonthlyLimits

class UpgradePlanRequest(BaseModel):
    plan: str
