from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List

class AnalysisItemResponse(BaseModel):
    id: UUID
    analysis_id: UUID
    title: str
    category: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    explanation: str
    original_text: str
    suggestion: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisResponse(BaseModel):
    id: UUID
    document_id: UUID
    overall_risk_score: int
    summary: str
    recommendations: str
    processing_time: float
    provider: str
    model_name: str
    created_at: datetime
    items: List[AnalysisItemResponse]

    class Config:
        from_attributes = True
