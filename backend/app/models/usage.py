import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Usage(Base):
    __tablename__ = "usage_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    analysis_count = Column(Integer, default=0, nullable=False)
    documents_uploaded = Column(Integer, default=0, nullable=False)
    storage_used = Column(Integer, default=0, nullable=False)  # stored in bytes
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'month', 'year', name='uq_user_month_year'),
    )

    # Relationship back to User
    user = relationship("User", back_populates="usages")
