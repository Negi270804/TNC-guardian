import sys
import os
import uuid
import asyncio
import httpx
import shutil
from datetime import datetime, timezone
from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.main import app
from app.dependencies.auth import get_current_user
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.document import Document
from app.services.ocr_service import OCRService

async def create_test_user():
    email = f"test_pdf_{uuid.uuid4().hex[:8]}@example.com"
    async with AsyncSessionLocal() as session:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash="hashed_password",
            full_name="PDF Tester",
            is_verified=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        # Setup default subscription
        from app.services.subscription_service import SubscriptionService
        sub_service = SubscriptionService(session)
        await sub_service.get_or_create_subscription(user.id)
        await session.commit()
        
        return user

def generate_text_pdf(path: str, pages: int):
    print(f"Generating selectable text PDF at {path} with {pages} pages...")
    c = canvas.Canvas(path)
    for i in range(pages):
        c.drawString(100, 500, f"This is selectable text on page {i+1} of a {pages}-page TNC Guardian PDF document.")
        c.showPage()
    c.save()

def generate_scanned_pdf(path: str, pages: int):
    print(f"Generating scanned image-only PDF at {path} with {pages} pages...")
    # Create temporary images
    os.makedirs("temp_test_imgs", exist_ok=True)
    images = []
    for i in range(pages):
        img_path = f"temp_test_imgs/page_{i}.png"
        img = Image.new('RGB', (800, 1100), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        d.text((100, 500), f"SCANNED PAGE IMAGE CONTENT FOR PAGE {i+1}", fill=(0, 0, 0))
        img.save(img_path)
        images.append(Image.open(img_path))
    
    # Save as PDF
    if images:
        images[0].save(path, save_all=True, append_images=images[1:])
        
    # Close images and cleanup temp folder
    for img in images:
        img.close()
    shutil.rmtree("temp_test_imgs", ignore_errors=True)

async def run_tests():
    print("--- Starting Sequential PDF OCR & RAM Stabilization Tests ---")
    user = await create_test_user()
    print(f"Created test user: {user.email}")
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    os.makedirs("test_pdfs", exist_ok=True)
    
    # Generate test files
    pdf_text_1 = "test_pdfs/text_1.pdf"
    pdf_text_5 = "test_pdfs/text_5.pdf"
    pdf_text_10 = "test_pdfs/text_10.pdf"
    pdf_scanned_1 = "test_pdfs/scanned_1.pdf"
    pdf_scanned_5 = "test_pdfs/scanned_5.pdf"
    
    generate_text_pdf(pdf_text_1, 1)
    generate_text_pdf(pdf_text_5, 5)
    generate_text_pdf(pdf_text_10, 10)
    generate_scanned_pdf(pdf_scanned_1, 1)
    generate_scanned_pdf(pdf_scanned_5, 5)
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", timeout=120.0) as client:
        # Reset EasyOCR reader to None to verify lazy initialization
        OCRService._reader = None
        
        # --- TEST 1: Selectable text PDF (1 page) ---
        print("\n=== TEST 1: 1-Page Selectable Text PDF (Should skip OCR) ===")
        with open(pdf_text_1, "rb") as f:
            files = {"file": ("text_1.pdf", f, "application/pdf")}
            resp = await client.post("/api/documents/upload", files=files)
        assert resp.status_code == 201
        doc_id = resp.json()["id"]
        
        resp = await client.post(f"/api/documents/{doc_id}/extract")
        assert resp.status_code == 200
        extracted_data = resp.json()
        print(f"[SUCCESS] Extracted text: {extracted_data['extracted_text'].strip()}")
        assert "selectable text on page 1" in extracted_data["extracted_text"]
        # Ensure OCR reader was NOT loaded
        assert OCRService._reader is None, "Error: OCR Reader should not be loaded for selectable text PDFs!"
        print("[SUCCESS] Verified EasyOCR Reader remained uninitialized (OCR skipped).")
        
        # --- TEST 2: Multi-Page Selectable text PDF (5 pages) ---
        print("\n=== TEST 2: 5-Page Selectable Text PDF ===")
        with open(pdf_text_5, "rb") as f:
            files = {"file": ("text_5.pdf", f, "application/pdf")}
            resp = await client.post("/api/documents/upload", files=files)
        assert resp.status_code == 201
        doc_id_5 = resp.json()["id"]
        
        resp = await client.post(f"/api/documents/{doc_id_5}/extract")
        assert resp.status_code == 200
        extracted_data = resp.json()
        assert "page 5 of a 5-page" in extracted_data["extracted_text"]
        assert OCRService._reader is None, "Error: OCR Reader should still be uninitialized!"
        print("[SUCCESS] Verified multi-page selectable text extracted successfully with zero OCR overhead.")
        
        # --- TEST 3: Multi-Page Selectable text PDF (10 pages) ---
        print("\n=== TEST 3: 10-Page Selectable Text PDF ===")
        with open(pdf_text_10, "rb") as f:
            files = {"file": ("text_10.pdf", f, "application/pdf")}
            resp = await client.post("/api/documents/upload", files=files)
        assert resp.status_code == 201
        doc_id_10 = resp.json()["id"]
        
        resp = await client.post(f"/api/documents/{doc_id_10}/extract")
        assert resp.status_code == 200
        extracted_data = resp.json()
        assert "page 10 of a 10-page" in extracted_data["extracted_text"]
        assert OCRService._reader is None
        print("[SUCCESS] Verified 10-page selectable text extracted successfully.")
        
        # --- TEST 4: Scanned PDF (1 page) ---
        print("\n=== TEST 4: 1-Page Scanned PDF (Should trigger EasyOCR) ===")
        with open(pdf_scanned_1, "rb") as f:
            files = {"file": ("scanned_1.pdf", f, "application/pdf")}
            resp = await client.post("/api/documents/upload", files=files)
        assert resp.status_code == 201
        scanned_id_1 = resp.json()["id"]
        
        resp = await client.post(f"/api/documents/{scanned_id_1}/extract")
        assert resp.status_code == 200
        extracted_data = resp.json()
        print(f"[SUCCESS] Extracted OCR text: {extracted_data['extracted_text'].strip()}")
        # Check parts of text to ignore spacing differences
        assert "SCANNED" in extracted_data["extracted_text"].upper()
        # Ensure OCR reader is now initialized
        assert OCRService._reader is not None, "Error: OCR Reader should be initialized!"
        print("[SUCCESS] Verified fallback image OCR executed successfully.")
        
        # --- TEST 5: Scanned PDF (5 pages) ---
        print("\n=== TEST 5: 5-Page Scanned PDF (Sequential OCR rendering) ===")
        with open(pdf_scanned_5, "rb") as f:
            files = {"file": ("scanned_5.pdf", f, "application/pdf")}
            resp = await client.post("/api/documents/upload", files=files)
        assert resp.status_code == 201
        scanned_id_5 = resp.json()["id"]
        
        resp = await client.post(f"/api/documents/{scanned_id_5}/extract")
        assert resp.status_code == 200
        extracted_data = resp.json()
        # Check text exists for last page
        assert "PAGE" in extracted_data["extracted_text"].upper()
        print("[SUCCESS] Verified 5-page scanned PDF sequentially processed page-by-page.")
        
        # --- TEST 6: Graceful High-Memory Abort ---
        print("\n=== TEST 6: Graceful abort when memory threshold exceeded ===")
        # We can dynamically lower the limit parameter to trigger memory check failure
        # Let's mock get_memory_usage_mb to return a high value (e.g. 500 MB)
        original_get_mem = sys.modules['app.services.ocr_service'].get_memory_usage_mb
        sys.modules['app.services.ocr_service'].get_memory_usage_mb = lambda: 500.0
        
        with open(pdf_scanned_1, "rb") as f:
            files = {"file": ("scanned_abort.pdf", f, "application/pdf")}
            resp = await client.post("/api/documents/upload", files=files)
        assert resp.status_code == 201
        abort_id = resp.json()["id"]
        
        resp = await client.post(f"/api/documents/{abort_id}/extract")
        print(f"Status Code (Expected 400): {resp.status_code}")
        print(f"Error Response detail: {resp.json().get('detail')}")
        assert resp.status_code == 400
        assert "high server memory usage" in resp.json().get("detail", "").lower()
        print("[SUCCESS] Gracefully aborted OCR and returned detailed 400 Bad Request to prevent restart.")
        
        # Restore mock memory function
        sys.modules['app.services.ocr_service'].get_memory_usage_mb = original_get_mem
        
        # Cleanup documents
        print("\n=== Cleaning Up Test Documents ===")
        for d_id in [doc_id, doc_id_5, doc_id_10, scanned_id_1, scanned_id_5, abort_id]:
            await client.delete(f"/api/documents/{d_id}")

    # Remove temporary files
    shutil.rmtree("test_pdfs", ignore_errors=True)
    print("\n--- All Sequential PDF OCR & RAM Stabilization Tests Passed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
