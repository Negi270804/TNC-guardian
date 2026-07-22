import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Extended profile columns
    avatar_url = Column(String(512), nullable=True)
    company = Column(String(255), nullable=True)
    designation = Column(String(255), nullable=True)
    bio = Column(String(1000), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # SaaS Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    usages = relationship("Usage", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
