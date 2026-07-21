from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class AnalysisBriefResponse(BaseModel):
    id: UUID
    overall_risk_score: int
    processing_time: float
    provider: str
    model_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
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

    # Extended OCR details
    processing_status: str
    text_extracted: bool
    extracted_text: Optional[str] = None
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None

    # Analysis reference
    analysis: Optional[AnalysisBriefResponse] = None

    class Config:
        from_attributes = True
