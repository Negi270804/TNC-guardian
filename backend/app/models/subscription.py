import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    plan = Column(String(50), default="FREE", nullable=False)  # "FREE" or "PRO"
    status = Column(String(50), default="ACTIVE", nullable=False)  # "ACTIVE", "CANCELLED", etc.
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    renewal_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship back to User
    user = relationship("User", back_populates="subscription")
