import secrets
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.services.email_service import EmailService

logger = logging.getLogger("app.api.auth")
router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        repo = UserRepository(db)
        
        # Assert email uniqueness
        existing_user = await repo.get_by_email(payload.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        
        # Hash password credentials
        hashed_pwd = AuthService.hash_password(payload.password)
        
        # Create new model mapped record
        new_user = User(
            email=payload.email,
            full_name=payload.full_name,
            password_hash=hashed_pwd,
            is_active=True,
            is_verified=False
        )
        
        db_user = await repo.create(new_user)
        return db_user
    except Exception as e:
        logger.exception("Registration failed")
        raise

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        repo = UserRepository(db)
        user = await repo.get_by_email(payload.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect email or password."
            )
        
        # Verify cryptography match
        if not AuthService.verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect email or password."
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated."
            )
        
        # Sign user token sub value with UUID string
        access_token = AuthService.create_access_token(subject=str(user.id))
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user
        }
    except Exception as e:
        logger.exception("Login failed")
        raise

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # Stateless authentication logout message
    return {"message": "Logged out successfully from session."}

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(payload.email)
    
    # Generic message to prevent email enumeration
    generic_response = {"message": "If an account exists for this email, a password reset link has been sent."}
    
    if not user:
        return generic_response
        
    # Generate secure random token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=20)
    
    await db.commit()
    
    # Trigger SMTP email sending asynchronously
    await EmailService.send_reset_email(user.email, token)
    
    return generic_response

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password confirmation does not match new password."
        )
        
    repo = UserRepository(db)
    user = await repo.get_by_reset_token(payload.token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )
        
    # Ensure token is not expired
    if not user.reset_token_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )
        
    # Ensure token is within valid window
    now = datetime.now(timezone.utc)
    expires_at = user.reset_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )
        
    # Valid token! Update user's password and clear reset token state
    user.password_hash = AuthService.hash_password(payload.password)
    user.reset_token = None
    user.reset_token_expires_at = None
    
    await db.commit()
    
    return {"message": "Password has been reset successfully."}
