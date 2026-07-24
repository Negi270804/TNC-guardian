import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.ocr_service import OCRService
from app import config

logger = logging.getLogger("app.api.documents")

router = APIRouter()

# Resolve target base uploads location relative to backend project path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".webp", ".bmp"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/pjpeg",
    "image/webp",
    "image/bmp",
    "image/x-ms-bmp"
}
MAX_FILE_SIZE = config.PRO_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024  # Dynamic fallback limit


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate Extension
    original_filename = file.filename or "unnamed_document"
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP, BMP."
        )

    # 2. Validate MIME Type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file content type '{file.content_type}'. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP, BMP."
        )

    # 3. Fetch subscription and validate File Size based on plan
    from app.services.subscription_service import SubscriptionService
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(current_user.id)
    
    free_limit = config.FREE_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024
    pro_limit = config.PRO_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024
    max_size = free_limit if sub.plan == "FREE" else pro_limit
    max_size_str = f"{config.FREE_PLAN_UPLOAD_LIMIT_MB} MB" if sub.plan == "FREE" else f"{config.PRO_PLAN_UPLOAD_LIMIT_MB} MB"


    file_size = 0
    if hasattr(file, "size") and file.size is not None:
        file_size = file.size

    if file_size <= 0:
        try:
            if inspect.iscoroutinefunction(file.seek):
                await file.seek(0, 2)
                file_size = await file.tell()
                await file.seek(0)
            else:
                file.file.seek(0, 2)
                file_size = file.file.tell()
                file.file.seek(0)
        except Exception:
            file_size = int(file.headers.get("content-length", 0))

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the maximum limit of {max_size_str} for your {sub.plan.capitalize()} plan."
        )
    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid empty file uploaded."
        )

    # 4. Generate metadata IDs & paths
    doc_id = uuid.uuid4()
    stored_filename = f"{uuid.uuid4()}{ext}"
    user_upload_dir = os.path.join(UPLOADS_DIR, str(current_user.id), str(doc_id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    storage_path = os.path.join(user_upload_dir, stored_filename)

    # 5. Save the physical file on disk
    try:
        with open(storage_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write uploaded file to disk storage: {str(e)}"
        )

    # 6. Save document record in PostgreSQL
    new_doc = Document(
        id=doc_id,
        user_id=current_user.id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_type=ext.lstrip('.'),
        file_size=file_size,
        upload_status="UPLOADED",
        storage_path=storage_path,
        processing_status="UPLOADED"
    )

    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    
    # Increment uploads counter and storage usage in usage tracking
    await sub_service.increment_uploads(current_user.id, file_size)
    
    return new_doc

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.id == document_id)
    res = await db.execute(query)
    doc = res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Auth check: each user can only access their own documents
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document."
        )

    return doc

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.id == document_id)
    res = await db.execute(query)
    doc = res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Auth check: each user can only delete their own documents
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this document."
        )

    # Remove the physical file and container folder from disk
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
            parent_dir = os.path.dirname(doc.storage_path)
            if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                os.rmdir(parent_dir)
        except Exception as e:
            logger.error(f"[CLEANUP ERROR] Failed to clean document directories: {str(e)}")

    # Remove record from database
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully."}

@router.post("/{document_id}/extract", response_model=DocumentResponse)
async def extract_document_text(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.id == document_id)
    res = await db.execute(query)
    doc = res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Auth check
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document."
        )

    # Update state to PROCESSING
    doc.processing_status = "PROCESSING"
    doc.processing_started_at = datetime.now(timezone.utc)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    logger.info(f"Starting text extraction for document {doc.id} ({doc.original_filename})")
    start_time = datetime.now(timezone.utc)

    try:
        # Run text extraction service
        extraction_result = await OCRService.extract_text(doc.storage_path, doc.file_type)
        
        # Save completed details
        doc.extracted_text = extraction_result["text"]
        doc.page_count = extraction_result["page_count"]
        doc.word_count = extraction_result["word_count"]
        doc.text_extracted = True
        doc.processing_status = "COMPLETED"
        doc.processing_completed_at = datetime.now(timezone.utc)
        logger.info(f"Successfully extracted text for document {doc.id} in {(datetime.now(timezone.utc) - start_time).total_seconds():.2f}s. Pages: {doc.page_count}, Words: {doc.word_count}")
    except FileNotFoundError as fnf:
        doc.processing_status = "FAILED"
        doc.processing_completed_at = datetime.now(timezone.utc)
        db.add(doc)
        await db.commit()
        logger.error(f"File not found for document {doc.id}: {str(fnf)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document file not found on server disk. Please re-upload. Details: {str(fnf)}"
        )
    except (ValueError, RuntimeError) as re:
        doc.processing_status = "FAILED"
        doc.processing_completed_at = datetime.now(timezone.utc)
        db.add(doc)
        await db.commit()
        logger.error(f"Extraction processing failure for document {doc.id}: {str(re)}")
        # Check if it sounds like a PDF layout or corrupt file error
        err_msg = str(re)
        if "pdf" in err_msg.lower() or "layout" in err_msg.lower():
            detail_msg = f"Failed to extract text: The PDF file appears to be corrupted, password-protected, or invalid. Details: {err_msg}"
        else:
            detail_msg = f"Failed to extract text and execute OCR processing: {err_msg}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail_msg
        )
    except Exception as e:
        # Gracefully handle failures
        doc.processing_status = "FAILED"
        doc.processing_completed_at = datetime.now(timezone.utc)
        db.add(doc)
        await db.commit()
        logger.error(f"Unexpected exception during text extraction for document {doc.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed due to an unexpected system error: {str(e)}"
        )

    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/{document_id}/text")
async def get_document_text(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.id == document_id)
    res = await db.execute(query)
    doc = res.scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Auth check
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document."
        )

    if not doc.text_extracted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text has not been extracted from this document yet. Call the extract endpoint first."
        )

    return {
        "document_id": doc.id,
        "original_filename": doc.original_filename,
        "extracted_text": doc.extracted_text,
        "page_count": doc.page_count,
        "word_count": doc.word_count
    }
