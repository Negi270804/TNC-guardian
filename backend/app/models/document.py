import uuid
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False, index=True)
    file_size = Column(Integer, nullable=False)
    upload_status = Column(String(50), default="UPLOADED", nullable=False)
    storage_path = Column(String(512), nullable=False)
    source_type = Column(String(50), default="PDF", nullable=False, index=True)
    source_url = Column(String(2048), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Extended OCR and processing columns
    processing_status = Column(String(50), default="UPLOADED", nullable=False, index=True)
    text_extracted = Column(Boolean, default=False, nullable=False)
    extracted_text = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)

    # 1-to-1 relationship with Analysis model
    analysis = relationship("Analysis", back_populates="document", uselist=False, cascade="all, delete-orphan", lazy="selectin")
