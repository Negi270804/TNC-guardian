import sys
import os
import uuid
import asyncio
import httpx
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.main import app
from app.dependencies.auth import get_current_user
from app.database import AsyncSessionLocal
from app.models.user import User

async def get_or_create_user(email: str, name: str):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == email))
        user = res.scalars().first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                email=email,
                password_hash="hashed_password",
                full_name=name,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        return user

async def run_tests():
    print("--- Starting File Uploads Integration Tests ---")
    user = await get_or_create_user("upload_test_user@example.com", "Upload Tester")
    print(f"Testing as user: {user.email}")
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    # Files to test: (filename, content_bytes, mime_type)
    test_files = [
        ("test.pdf", b"%PDF-1.4 mock pdf document content", "application/pdf"),
        ("test.docx", b"PK\x03\x04 mock docx file zip header and text content here", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("test.txt", b"Mock plain text document content for testing file uploads.", "text/plain"),
        ("test.png", b"\x89PNG\r\n\x1a\n mock png file image content", "image/png"),
        ("test.jpg", b"\xff\xd8\xff mock jpeg file image content", "image/jpeg")
    ]
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", timeout=15.0) as client:
        for filename, content, mime in test_files:
            print(f"\nUploading {filename} (Type: {mime})...")
            # Construct files payload
            files = {"file": (filename, content, mime)}
            
            resp = await client.post("/api/documents/upload", files=files)
            print(f"Status Code (Expected 201): {resp.status_code}")
            print(f"Response: {resp.json()}")
            
            assert resp.status_code == 201, f"Failed to upload {filename}: {resp.text}"
            data = resp.json()
            assert "id" in data
            assert data["original_filename"] == filename
            assert data["upload_status"] == "UPLOADED"
            print(f"[SUCCESS] {filename} uploaded and written to disk successfully!")
            
    print("\n--- All File Uploads Integration Tests Completed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
