import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    overall_risk_score = Column(Integer, nullable=False, index=True)
    summary = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    processing_time = Column(Float, nullable=False)
    provider = Column(String(50), nullable=False)
    model_name = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Establish one-to-many relationship to individual clauses items
    items = relationship("AnalysisItem", back_populates="analysis", cascade="all, delete-orphan", lazy="selectin")
    document = relationship("Document", back_populates="analysis")

class AnalysisItem(Base):
    __tablename__ = "analysis_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    risk_level = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    explanation = Column(Text, nullable=False)
    original_text = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Bind reference back to the parent summary record
    analysis = relationship("Analysis", back_populates="items")
