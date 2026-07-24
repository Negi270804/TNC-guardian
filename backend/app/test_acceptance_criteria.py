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
from app.services.subscription_service import SubscriptionService

async def create_new_user():
    email = f"test_acceptance_{uuid.uuid4().hex[:8]}@example.com"
    async with AsyncSessionLocal() as session:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash="hashed_password",
            full_name="Acceptance Tester",
            is_verified=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        # Initialize subscription explicitly
        sub_service = SubscriptionService(session)
        await sub_service.upgrade_plan(user.id, "PRO")  # Use PRO to avoid hit of limit 10
        await session.commit()
        
        return user

async def run_tests():
    print("--- Starting Acceptance Criteria Verification Tests ---")
    user = await create_new_user()
    print(f"Created user: {user.email}")
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    test_urls = [
        ("MIT License", "https://opensource.org/licenses/MIT"),
        ("Mozilla Privacy Policy", "https://www.mozilla.org/en-US/privacy/"),
        ("GitHub Terms", "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"),
        ("Zomato Terms", "https://www.zomato.com/conditions")
    ]
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", timeout=45.0) as client:
        # 1. Test URL Extraction on target URLs
        for name, url in test_urls:
            print(f"\nAnalyzing {name} URL: {url}...")
            try:
                resp = await client.post("/api/analysis/url", json={"url": url})
                print(f"Status Code: {resp.status_code}")
                if resp.status_code == 201:
                    data = resp.json()
                    print(f"[SUCCESS] {name} analyzed successfully!")
                    print(f"Overall Risk Score: {data.get('overall_risk_score')}/100")
                    print(f"Summary: {data.get('summary')[:100]}...")
                    print(f"Detected Clauses Count: {len(data.get('items', []))}")
                    assert "overall_risk_score" in data
                    assert "summary" in data
                elif resp.status_code in (400, 403, 429, 502, 504):
                    # Gracefully rejected or blocked by Cloudflare/network
                    print(f"[GRACEFUL RESPONSE] {name} returned status {resp.status_code}: {resp.json().get('detail')}")
                else:
                    print(f"[FAIL] Unexpected status code: {resp.status_code} - {resp.text}")
                    assert False, f"Unexpected response code {resp.status_code}"
            except Exception as e:
                print(f"[FAIL] Exception raised during {name} analysis: {str(e)}")
                assert False, f"Exception raised: {str(e)}"
                
        # 2. Test Invalid URL rejection
        print("\nTesting Invalid URL rejection...")
        invalid_url = "https://this-domain-does-not-exist-at-all-12345.com"
        resp = await client.post("/api/analysis/url", json={"url": invalid_url})
        print(f"Status Code (Expected 400): {resp.status_code}")
        print(f"Response: {resp.json()}")
        assert resp.status_code == 400
        detail_msg = resp.json().get("detail", "")
        assert "Unable to extract" in detail_msg or "resolve" in detail_msg or "hostname" in detail_msg
        print("[SUCCESS] Invalid URL rejected gracefully.")

        # 3. Test Empty input rejection
        print("\nTesting Empty input rejection...")
        resp = await client.post("/api/analysis/text", json={"text": "   "})
        print(f"Status Code (Expected 422): {resp.status_code}")
        print(f"Response: {resp.json()}")
        assert resp.status_code == 422
        assert "at least 100 characters" in resp.json().get("detail", [])[0].get("msg", "")
        print("[SUCCESS] Empty input rejected gracefully.")

        # 4. Test SSRF prevention
        print("\nTesting SSRF prevention...")
        ssrf_url = "http://localhost:8000/admin"
        resp = await client.post("/api/analysis/url", json={"url": ssrf_url})
        print(f"Status Code (Expected 400): {resp.status_code}")
        print(f"Response: {resp.json()}")
        assert resp.status_code == 400
        assert "prohibited" in resp.json().get("detail", "").lower() or "blocked" in resp.json().get("detail", "").lower()
        print("[SUCCESS] SSRF attempt rejected successfully.")

    print("\n--- All Acceptance Criteria Tests Completed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
