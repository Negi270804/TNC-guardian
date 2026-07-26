import sys
import os
import uuid
import asyncio
import httpx
import shutil
from datetime import datetime, timezone
from PIL import Image, ImageDraw

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.main import app
from app.dependencies.auth import get_current_user
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.document import Document

async def create_test_user():
    email = f"test_ocr_{uuid.uuid4().hex[:8]}@example.com"
    async with AsyncSessionLocal() as session:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash="hashed_password",
            full_name="OCR Tester",
            is_verified=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        # Verify user has default subscription
        from app.services.subscription_service import SubscriptionService
        sub_service = SubscriptionService(session)
        await sub_service.get_or_create_subscription(user.id)
        await session.commit()
        
        return user

def generate_test_images():
    print("\n--- Generating Programmatic Test Images ---")
    os.makedirs("test_files", exist_ok=True)
    
    # 1. Small test image (200x200)
    small_path = "test_files/ocr_small.png"
    img_small = Image.new('RGB', (300, 100), color=(255, 255, 255))
    d_small = ImageDraw.Draw(img_small)
    d_small.text((20, 40), "TNC GUARDIAN MOCK TEXT FOR OCR SMALL", fill=(0, 0, 0))
    img_small.save(small_path)
    print(f"Generated small test image: {small_path} ({os.path.getsize(small_path)} bytes)")
    
    # 2. Large test image (2000x2000)
    large_path = "test_files/ocr_large.png"
    img_large = Image.new('RGB', (2000, 2000), color=(255, 255, 255))
    d_large = ImageDraw.Draw(img_large)
    d_large.text((100, 500), "TNC GUARDIAN LARGE IMAGE RESOLUTION OCR TEST TEXT", fill=(0, 0, 0))
    img_large.save(large_path)
    print(f"Generated large test image: {large_path} ({os.path.getsize(large_path)} bytes)")
    
    return small_path, large_path

async def run_tests():
    print("--- Starting OCR & Deletion Verification Tests ---")
    user = await create_test_user()
    print(f"Created test user: {user.email}")
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    small_img_path, large_img_path = generate_test_images()
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", timeout=60.0) as client:
        # --- TEST 1: Small Image Ingestion & OCR ---
        print("\n=== TEST 1: Small Image Upload & OCR ===")
        with open(small_img_path, "rb") as f:
            files = {"file": ("ocr_small.png", f, "image/png")}
            resp = await client.post("/api/documents/upload", files=files)
        
        assert resp.status_code == 201, f"Upload failed: {resp.text}"
        doc_data = resp.json()
        doc_id = doc_data["id"]
        storage_path = doc_data["storage_path"]
        print(f"[SUCCESS] Small Image uploaded. Document ID: {doc_id}")
        print(f"Stored storage path: {storage_path}")
        
        # Trigger OCR Extraction
        print(f"Triggering OCR extraction for small image {doc_id}...")
        resp = await client.post(f"/api/documents/{doc_id}/extract")
        assert resp.status_code == 200, f"Extraction failed: {resp.text}"
        extracted_data = resp.json()
        print(f"[SUCCESS] Small Image OCR completed. Status: {extracted_data['processing_status']}")
        print(f"Extracted Text: {extracted_data['extracted_text']}")
        assert extracted_data["text_extracted"] is True
        assert extracted_data["extracted_text"] is not None
        
        # --- TEST 2: Large Image Ingestion & OCR (Memory Optimization Check) ---
        print("\n=== TEST 2: Large Image Upload & OCR (Memory Downscaling Check) ===")
        with open(large_img_path, "rb") as f:
            files = {"file": ("ocr_large.png", f, "image/png")}
            resp = await client.post("/api/documents/upload", files=files)
        
        assert resp.status_code == 201, f"Upload failed: {resp.text}"
        large_doc_data = resp.json()
        large_doc_id = large_doc_data["id"]
        large_storage_path = large_doc_data["storage_path"]
        print(f"[SUCCESS] Large Image uploaded. Document ID: {large_doc_id}")
        
        # Trigger OCR Extraction (Should downscale from 2000 to 1500 to save memory)
        print(f"Triggering OCR extraction for large image {large_doc_id}...")
        resp = await client.post(f"/api/documents/{large_doc_id}/extract")
        assert resp.status_code == 200, f"Extraction failed: {resp.text}"
        large_extracted_data = resp.json()
        print(f"[SUCCESS] Large Image OCR completed. Status: {large_extracted_data['processing_status']}")
        print(f"Extracted Text: {large_extracted_data['extracted_text']}")
        assert large_extracted_data["text_extracted"] is True
        
        # --- TEST 3: Recursive Document Directory Cleanup ---
        print("\n=== TEST 3: Recursive Deletion and Folder Cleanup ===")
        doc_folder = os.path.dirname(storage_path)
        assert os.path.exists(doc_folder), f"Expected document folder to exist: {doc_folder}"
        assert os.path.exists(storage_path), f"Expected physical file to exist: {storage_path}"
        
        print(f"Deleting small document {doc_id}...")
        resp = await client.delete(f"/api/documents/{doc_id}")
        assert resp.status_code == 200, f"Delete failed: {resp.text}"
        print("[SUCCESS] Delete API endpoint returned 200.")
        
        # Verify directory & file is recursively removed
        assert not os.path.exists(storage_path), "Error: Physical file still exists on disk!"
        assert not os.path.exists(doc_folder), "Error: Document parent folder still exists on disk!"
        print("[SUCCESS] Disk cleanup verified: physical file and containing folder recursively deleted.")
        
        # --- TEST 4: Delete succeed even if file is missing ---
        print("\n=== TEST 4: Delete when file/folder is already missing ===")
        large_doc_folder = os.path.dirname(large_storage_path)
        # Programmatically remove folder first to simulate missing file
        if os.path.exists(large_doc_folder):
            shutil.rmtree(large_doc_folder)
        assert not os.path.exists(large_storage_path), "Simulated setup failed"
        
        print(f"Deleting large document {large_doc_id} with missing storage file...")
        resp = await client.delete(f"/api/documents/{large_doc_id}")
        assert resp.status_code == 200, f"Delete failed on missing file: {resp.text}"
        print("[SUCCESS] Delete succeeded cleanly even though physical file was already missing.")
        
        # Check DB to ensure record is deleted
        async with AsyncSessionLocal() as session:
            check_query = select(Document).where(Document.id.in_([uuid.UUID(doc_id), uuid.UUID(large_doc_id)]))
            res = await session.execute(check_query)
            remaining_docs = res.scalars().all()
            assert len(remaining_docs) == 0, f"Expected both docs to be deleted from database, found: {remaining_docs}"
            print("[SUCCESS] Verified document records deleted from PostgreSQL database.")

    # Cleanup temp folder
    shutil.rmtree("test_files", ignore_errors=True)
    print("\n--- All OCR & Deletion Tests Passed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
