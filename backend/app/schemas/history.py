from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.schemas.analysis import AnalysisResponse

class HistoryBriefAnalysis(BaseModel):
    id: UUID
    overall_risk_score: int
    processing_time: float
    provider: str
    model_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int
    upload_status: str
    storage_path: str
    created_at: datetime
    updated_at: datetime
    source_type: str
    source_url: Optional[str] = None
    processing_status: str
    text_extracted: bool
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    
    analysis: Optional[HistoryBriefAnalysis] = None
    risk_level: Optional[str] = None  # LOW, MEDIUM, HIGH, CRITICAL

    class Config:
        from_attributes = True

class HistoryListResponse(BaseModel):
    items: List[HistoryItemResponse]
    total: int
    page: int
    limit: int
    pages: int

class HistoryDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int
    upload_status: str
    storage_path: str
    created_at: datetime
    updated_at: datetime
    source_type: str
    source_url: Optional[str] = None
    processing_status: str
    text_extracted: bool
    extracted_text: Optional[str] = None
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    
    analysis: Optional[AnalysisResponse] = None
    risk_level: Optional[str] = None

    class Config:
        from_attributes = True
