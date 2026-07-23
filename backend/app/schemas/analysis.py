from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any

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
    missing_clauses: Optional[List[Dict[str, Any]]] = None
    ai_explanation: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: datetime
    items: List[AnalysisItemResponse]

    @field_validator('missing_clauses', mode='before')
    @classmethod
    def parse_missing_clauses(cls, v):
        if isinstance(v, str) and v.strip():
            import json
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    class Config:
        from_attributes = True

class AnalysisSummaryResponse(BaseModel):
    document_id: UUID
    summary: str
    recommendations: str
    processing_time: float
    provider: str
    model_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisRiskScoreResponse(BaseModel):
    document_id: UUID
    overall_risk_score: int
    created_at: datetime

    class Config:
        from_attributes = True
