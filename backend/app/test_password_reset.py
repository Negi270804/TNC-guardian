import sys
import os
import uuid
import asyncio
import httpx
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.main import app
from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import AuthService

async def run_tests():
    print("--- Starting Password Reset Integration Tests ---")
    test_email = f"reset_test_{uuid.uuid4().hex[:6]}@example.com"
    test_password = "OldPassword123!"
    new_password = "NewPassword123!"
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", timeout=15.0) as client:
        # 1. Register a test user
        print(f"\n1. Registering user: {test_email}...")
        reg_payload = {
            "email": test_email,
            "full_name": "Reset Tester",
            "password": test_password
        }
        resp = await client.post("/api/auth/register", json=reg_payload)
        assert resp.status_code == 201, f"Registration failed: {resp.text}"
        print("[SUCCESS] User registered.")

        # 2. Forgot password request (non-existent email)
        print("\n2. Requesting reset link for non-existent email...")
        resp = await client.post("/api/auth/forgot-password", json={"email": "nonexistent_user_email@example.com"})
        assert resp.status_code == 200, f"Expected 200 status code: {resp.text}"
        assert "reset link has been sent" in resp.json()["message"]
        print("[SUCCESS] Returned generic success message securely without account leakage.")

        # 3. Forgot password request (valid email)
        print("\n3. Requesting reset link for registered email...")
        resp = await client.post("/api/auth/forgot-password", json={"email": test_email})
        assert resp.status_code == 200, f"Expected 200 status code: {resp.text}"
        assert "reset link has been sent" in resp.json()["message"]
        print("[SUCCESS] Returned generic success message for valid email.")

        # Retrieve the generated token from database
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(User.email == test_email))
            db_user = res.scalars().first()
            assert db_user is not None
            token = db_user.reset_token
            expires_at = db_user.reset_token_expires_at
            assert token is not None
            assert expires_at is not None
            print(f"Retrieved token from DB: {token}")

        # 4. Attempt reset with invalid/fake token
        print("\n4. Resetting password with invalid token...")
        reset_payload = {
            "token": "fake_token_here",
            "password": new_password,
            "confirm_password": new_password
        }
        resp = await client.post("/api/auth/reset-password", json=reset_payload)
        assert resp.status_code == 400, f"Expected 400 status: {resp.text}"
        assert "Invalid or expired" in resp.json()["detail"]
        print("[SUCCESS] Invalid token rejected.")

        # 5. Attempt reset with weak passwords
        print("\n5. Resetting password with weak password (missing digit)...")
        reset_payload = {
            "token": token,
            "password": "WeakPassword!",
            "confirm_password": "WeakPassword!"
        }
        resp = await client.post("/api/auth/reset-password", json=reset_payload)
        assert resp.status_code == 422 or resp.status_code == 400, f"Expected validation failure: {resp.status_code}"
        print("[SUCCESS] Weak password strength checks rejected.")

        # 6. Attempt reset with expired token
        print("\n6. Resetting password with expired token...")
        # Manually expire the token in database
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(User.email == test_email))
            db_user = res.scalars().first()
            db_user.reset_token_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
            await session.commit()
            print("Token expiration updated to the past in database.")

        reset_payload = {
            "token": token,
            "password": new_password,
            "confirm_password": new_password
        }
        resp = await client.post("/api/auth/reset-password", json=reset_payload)
        assert resp.status_code == 400, f"Expected 400 status for expired token: {resp.text}"
        assert "Invalid or expired" in resp.json()["detail"]
        print("[SUCCESS] Expired token rejected.")

        # Re-request token
        print("\nRe-requesting a fresh reset token...")
        await client.post("/api/auth/forgot-password", json={"email": test_email})
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(User.email == test_email))
            db_user = res.scalars().first()
            token = db_user.reset_token
            print(f"New active token: {token}")

        # 7. Attempt reset with valid token but mismatched confirm password
        print("\n7. Resetting password with mismatched confirmation...")
        reset_payload = {
            "token": token,
            "password": new_password,
            "confirm_password": "DifferentConfirm123!"
        }
        resp = await client.post("/api/auth/reset-password", json=reset_payload)
        assert resp.status_code == 400, f"Expected 400 status: {resp.text}"
        assert "confirmation does not match" in resp.json()["detail"]
        print("[SUCCESS] Password confirmation mismatch rejected.")

        # 8. Reset successfully with valid token
        print("\n8. Resetting password successfully with valid token...")
        reset_payload = {
            "token": token,
            "password": new_password,
            "confirm_password": new_password
        }
        resp = await client.post("/api/auth/reset-password", json=reset_payload)
        assert resp.status_code == 200, f"Expected 200 status: {resp.text}"
        assert "successfully" in resp.json()["message"]
        print("[SUCCESS] Password updated successfully.")

        # Verify token is cleared in DB (single-use check)
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(User.email == test_email))
            db_user = res.scalars().first()
            assert db_user.reset_token is None
            assert db_user.reset_token_expires_at is None
            print("Verified token columns are set to None in database.")

        # 9. Verify token cannot be reused
        print("\n9. Attempting to reuse same token...")
        resp = await client.post("/api/auth/reset-password", json=reset_payload)
        assert resp.status_code == 400, f"Expected 400 status: {resp.text}"
        print("[SUCCESS] Re-use of token prevented.")

        # 10. Login with new password (should succeed)
        print("\n10. Logging in with the new password...")
        login_payload = {
            "email": test_email,
            "password": new_password
        }
        resp = await client.post("/api/auth/login", json=login_payload)
        assert resp.status_code == 200, f"Expected 200 status for new password login: {resp.text}"
        assert "access_token" in resp.json()
        print("[SUCCESS] Login with new password succeeded.")

        # 11. Login with old password (should fail)
        print("\n11. Logging in with the old password...")
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        resp = await client.post("/api/auth/login", json=login_payload)
        assert resp.status_code == 400, f"Expected 400 status for old password login: {resp.text}"
        print("[SUCCESS] Login with old password rejected.")

    print("\n--- All Password Reset Integration Tests Completed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
