import sys
import os
import uuid
import asyncio
import httpx
from datetime import datetime, timezone

sys.path.append(r"c:\Users\91886\Desktop\TNC-guardian\backend")

from sqlalchemy import select
from app.main import app
from app.dependencies.auth import get_current_user
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.subscription import Subscription
from app.models.usage import Usage
from app.services.subscription_service import SubscriptionService
from app import config
config.DEMO_MODE = False

async def create_new_free_user():
    email = f"test_free_{uuid.uuid4().hex[:8]}@example.com"
    async with AsyncSessionLocal() as session:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash="hashed_password",
            full_name="Free Tester",
            is_verified=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        # Initialize subscription explicitly via subscription service
        sub_service = SubscriptionService(session)
        await sub_service.get_or_create_subscription(user.id)
        await sub_service.get_or_create_usage(user.id)
        await session.commit()
        
        return user

async def run_tests():
    print("--- Starting Free Plan Limit Tests ---")
    user = await create_new_free_user()
    print(f"Created new test user: {user.email} ({user.id})")
    
    # Override auth dependency
    app.dependency_overrides[get_current_user] = lambda: user
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # Check initial remaining count
        print("\nChecking initial subscription status...")
        resp = await client.get("/api/subscription/current")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        print("Subscription Current Data:", data)
        assert data["plan"] == "FREE"
        assert data["remaining_analyses"] == 10, f"Expected 10 remaining analyses, got {data['remaining_analyses']}"
        print("[SUCCESS] New Free user starts with 10 analyses.")
        
        # Perform 10 analyses
        pasted_text = "This is a dummy Terms and Conditions text that needs to be at least 100 characters long to pass the length verification check. " * 3
        print(f"Length of text to analyze: {len(pasted_text)}")
        
        for i in range(1, 11):
            print(f"\nPerforming analysis #{i}...")
            resp = await client.post("/api/analysis/text", json={"text": pasted_text})
            assert resp.status_code == 201, f"Expected 201, got {resp.status_code} - {resp.text}"
            
            # Check remaining analyses count
            resp_sub = await client.get("/api/subscription/current")
            assert resp_sub.status_code == 200
            sub_data = resp_sub.json()
            remaining = sub_data["remaining_analyses"]
            expected_remaining = 10 - i
            print(f"Remaining analyses after #{i}: {remaining} (Expected: {expected_remaining})")
            assert remaining == expected_remaining, f"Expected {expected_remaining}, got {remaining}"
            print(f"[SUCCESS] Usage decreased properly after analysis #{i}.")
            
        # Verify 11th analysis is blocked
        print("\nAttempting 11th analysis (should be blocked)...")
        resp = await client.post("/api/analysis/text", json={"text": pasted_text})
        print("Status Code (Expected 403):", resp.status_code)
        print("Response:", resp.json())
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        assert "Free plan limit reached. Upgrade to Pro." in resp.json()["detail"]
        print("[SUCCESS] 11th analysis is blocked with the correct message.")

if __name__ == "__main__":
    asyncio.run(run_tests())
