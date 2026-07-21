from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

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

    class Config:
        from_attributes = True
