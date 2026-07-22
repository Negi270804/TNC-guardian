import sys
import os
import uuid
from datetime import datetime, timezone
sys.path.append(r"c:\Users\91886\Desktop\TNC-guardian\backend")

import asyncio
import httpx
from sqlalchemy import select

from app.main import app
from app.dependencies.auth import get_current_user
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.document import Document
from app.models.analysis import Analysis

# Fetch a user to run the tests as
async def get_test_user():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == "neginikhil424@gmail.com"))
        return res.scalars().first()

# Fetch another user to test auth violations
async def get_other_user():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == "user@example.com"))
        return res.scalars().first()

async def run_tests():
    test_user = await get_test_user()
    other_user = await get_other_user()
    
    if not test_user or not other_user:
        print("Test users not found! Make sure DB is populated.")
        return
        
    print(f"Testing as user: {test_user.email} ({test_user.id})")
    print(f"Other user: {other_user.email} ({other_user.id})")

    # Override get_current_user dependency
    app.dependency_overrides[get_current_user] = lambda: test_user

    # Use ASGITransport for newer httpx versions
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # 1. Test GET /api/history
        print("\n--- Testing GET /api/history ---")
        response = await client.get("/api/history")
        print("Status Code:", response.status_code)
        data = response.json()
        print("Total records found:", data["total"])
        print("Items length:", len(data["items"]))
        if len(data["items"]) > 0:
            item = data["items"][0]
            print(f"First item: '{item['original_filename']}', Risk Score: {item['analysis']['overall_risk_score'] if item['analysis'] else None}, Risk Level: {item['risk_level']}")

        # 2. Test Filters
        print("\n--- Testing filters ---")
        response_txt = await client.get("/api/history?file_type=txt")
        print("Filter file_type=txt total:", response_txt.json()["total"])
        
        response_pdf = await client.get("/api/history?file_type=pdf")
        print("Filter file_type=pdf total:", response_pdf.json()["total"])
        
        response_level = await client.get("/api/history?risk_level=medium")
        print("Filter risk_level=medium total:", response_level.json()["total"])

        # 3. Test Search
        print("\n--- Testing Search ---")
        response_search = await client.get("/api/history?search=Clustering")
        print("Search 'Clustering' total:", response_search.json()["total"])

        # 4. Test GET /api/history/{document_id}
        print("\n--- Testing GET /api/history/{id} ---")
        async with AsyncSessionLocal() as session:
            # Get Nikhil's document
            res = await session.execute(select(Document).where(Document.user_id == test_user.id))
            doc = res.scalars().first()
            
        if doc:
            print(f"Fetching document details for owner user: {doc.id}")
            response_detail = await client.get(f"/api/history/{doc.id}")
            print("Status Code:", response_detail.status_code)
            detail_data = response_detail.json()
            print("Filename:", detail_data["original_filename"])
            print("Analysis present:", detail_data["analysis"] is not None)
            if detail_data["analysis"]:
                print("Detected clauses count:", len(detail_data["analysis"]["items"]))

            # Access with other user (auth bypass test)
            print("\n--- Testing non-owner auth check ---")
            app.dependency_overrides[get_current_user] = lambda: other_user
            response_unauthorized = await client.get(f"/api/history/{doc.id}")
            print("Non-owner Status Code (expected 403):", response_unauthorized.status_code)
            print("Response detail:", response_unauthorized.json()["detail"])
            
            # Reset override to test_user
            app.dependency_overrides[get_current_user] = lambda: test_user
            
            # 5. Test POST /api/history/{id}/reanalyze
            print("\n--- Testing POST /api/history/{id}/reanalyze ---")
            response_re = await client.post(f"/api/history/{doc.id}/reanalyze")
            print("Status Code (expected 201):", response_re.status_code)
            if response_re.status_code == 201:
                print("Reanalyzed score:", response_re.json()["overall_risk_score"])
        else:
            print("No documents found for user to test details / reanalyze.")

        # 6. Test DELETE /api/history/{id}
        print("\n--- Testing DELETE /api/history/{id} ---")
        # Create a temporary document and analysis to test deletion
        async with AsyncSessionLocal() as session:
            temp_doc = Document(
                id=uuid.uuid4(),
                user_id=test_user.id,
                original_filename="temp_delete_test.txt",
                stored_filename="temp_delete_test.txt",
                file_type="txt",
                file_size=100,
                upload_status="UPLOADED",
                storage_path=os.path.join(os.path.expanduser("~"), "temp_delete_test.txt"),
                processing_status="COMPLETED",
                text_extracted=True,
                extracted_text="Some terms and conditions text containing cancel and arbitration."
            )
            session.add(temp_doc)
            await session.commit()
            
            temp_analysis = Analysis(
                document_id=temp_doc.id,
                overall_risk_score=60,
                summary="Temp summary",
                recommendations="Temp recommendations",
                processing_time=0.5,
                provider="mock",
                model_name="mock-v1"
            )
            session.add(temp_analysis)
            await session.commit()
            
            temp_doc_id = temp_doc.id
            # Write dummy file
            with open(temp_doc.storage_path, "w") as f:
                f.write("Temp file content")
                
            print(f"Created temp document {temp_doc_id} and physical file.")

        # Call delete endpoint
        response_del = await client.delete(f"/api/history/{temp_doc_id}")
        print("Delete Status Code:", response_del.status_code)
        print("Delete Response:", response_del.json())

        # Check that document is deleted from DB and file is deleted from disk
        async with AsyncSessionLocal() as session:
            check_doc = await session.get(Document, temp_doc_id)
            print("Document present in DB after delete:", check_doc is not None)
            print("Physical file deleted from disk:", not os.path.exists(temp_doc.storage_path))
            if os.path.exists(temp_doc.storage_path):
                os.remove(temp_doc.storage_path) # Clean up if it failed

    # Clean up overrides
    app.dependency_overrides.clear()

if __name__ == "__main__":
    asyncio.run(run_tests())
