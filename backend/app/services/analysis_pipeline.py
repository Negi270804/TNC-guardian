import time
import uuid
import re
import json
from typing import Optional, List, Dict
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.document import Document
from app.models.analysis import Analysis, AnalysisItem
from app.services.ai.factory import AIFactory
from app.services.ai.openai_service import OpenAIService
from app.services.subscription_service import SubscriptionService
from app.config import FREE_PLAN_ANALYSIS_LIMIT
from app import config

# Standard categories patterns for rule-based detection
RULE_PATTERNS = {
    "Arbitration": [
        r"\barbitration\b", r"\bwaive\b.*\bjury\b", r"\bclass\s+action\s+waiver\b",
        r"\bdispute\s+resolution\b", r"\bbinding\s+arbitration\b"
    ],
    "Auto Renewal": [
        r"\bauto-renew\b", r"\bautomatic\b.*\brenewal\b", r"\bautomatically\b.*\brenew\b",
        r"\brecurring\b.*\bcharge\b", r"\bsubscription\b.*\brenew\b", r"\bauto-renewal\b"
    ],
    "Subscription": [
        r"\bsubscription\b", r"\brecurring\b", r"\bbilling\b.*\bcycle\b", r"\bmonthly\b",
        r"\bannual\b", r"\bfee\b", r"\bcancel\b.*\bsubscription\b"
    ],
    "Refund Policy": [
        r"\brefund\b", r"\bnon-refundable\b", r"\bno\s+refunds\b", r"\ball\s+sales\s+are\s+final\b",
        r"\bcancellation\s+fee\b", r"\bcooling-off\b"
    ],
    "Data Collection": [
        r"\bcollect\b", r"\bgather\b", r"\btracking\b", r"\bcookies\b", r"\bpersonal\b.*\binformation\b",
        r"\btelemetry\b", r"\bdevice\b.*\binfo\b", r"\bdata\b.*\bcollection\b"
    ],
    "Data Sharing": [
        r"\bshare\b", r"\bdisclose\b", r"\bthird\b.*\bparty\b", r"\bthird-party\b", r"\baffiliate\b",
        r"\bpartners\b", r"\bsell\b.*\bdata\b", r"\bdata\b.*\bsharing\b"
    ],
    "Privacy": [
        r"\bprivacy\b", r"\bprivacy\b.*\bpolicy\b", r"\bpersonal\b.*\bdata\b", r"\bgdpr\b", r"\bccpa\b",
        r"\bconfidentiality\b"
    ],
    "Account Termination": [
        r"\bterminate\b", r"\btermination\b", r"\bsuspend\b.*\baccount\b", r"\bdelete\b.*\baccount\b",
        r"\bsole\s+discretion\b", r"\bblock\s+access\b"
    ],
    "Liability Limitation": [
        r"\blimitation\b.*\bliability\b", r"\blimited\b.*\bliability\b", r"\bliability\b.*\bwaiver\b",
        r"\bmaximum\s+extent\s+permitted\b", r"\bdisclaim\b.*\bdamages\b", r"\bhold\b.*\bharmless\b"
    ],
    "Governing Law": [
        r"\bgoverning\s+law\b", r"\bjurisdiction\b", r"\bchoice\s+of\s+law\b", r"\bvenue\b",
        r"\bapplicable\s+law\b", r"\bstate\s+of\b"
    ],
    "Indemnification": [
        r"\bindemnify\b", r"\bindemnification\b", r"\bhold\b.*\bharmless\b", r"\bdefend\b"
    ],
    "Intellectual Property": [
        r"\bintellectual\s+property\b", r"\btrademark\b", r"\bcopyright\b", r"\bproprietary\b",
        r"\bownership\b", r"\bpatent\b"
    ]
}

COMPILED_RULES = {
    cat: [re.compile(p, re.IGNORECASE) for p in pat_list]
    for cat, pat_list in RULE_PATTERNS.items()
}

def detect_clauses_rule_based(text: str) -> Dict[str, List[str]]:
    """
    Step 1: Rule-based clause detection.
    Scans the document text for keywords representing the 12 clause categories.
    Returns a dictionary of category -> list of matching paragraphs.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if len(paragraphs) <= 1:
        # Fallback split by lines if there are no double newlines
        paragraphs = [line.strip() for line in text.split("\n") if line.strip()]
        
    detected = {cat: [] for cat in RULE_PATTERNS}
    
    for paragraph in paragraphs:
        if len(paragraph) < 10:
            continue
            
        for cat, regex_list in COMPILED_RULES.items():
            for r in regex_list:
                if r.search(paragraph):
                    if paragraph not in detected[cat]:
                        # Limit candidates to first 3 matches per category to keep prompts concise
                        if len(detected[cat]) < 3:
                            detected[cat].append(paragraph)
                    break
                    
    # Return only categories that had matches
    return {cat: paragraphs for cat, paragraphs in detected.items() if paragraphs}


def calculate_weighted_risk_score(items: list) -> int:
    """
    Step 3: Risk scoring using weighted system.
    """
    weights = {
        "Auto Renewal": 20,
        "Refund Policy": 20,
        "Data Sharing": 15,
        "Arbitration": 15,
        "Liability Limitation": 20,
        "Subscription": 10,
        "Data Collection": 10,
        "Privacy": 10,
        "Account Termination": 10,
        "Governing Law": 10,
        "Indemnification": 10,
        "Intellectual Property": 10
    }
    
    # Map other potential/similar names to standard category names
    category_mapping = {
        "auto renewal": "Auto Renewal",
        "auto-renewal": "Auto Renewal",
        "refund policy": "Refund Policy",
        "no refund": "Refund Policy",
        "cancellation policy": "Refund Policy",
        "cancellation": "Refund Policy",
        "data sharing": "Data Sharing",
        "arbitration": "Arbitration",
        "liability limitation": "Liability Limitation",
        "liability limitations": "Liability Limitation",
        "liability waiver": "Liability Limitation",
        "subscription": "Subscription",
        "subscription risks": "Subscription",
        "payment risks": "Subscription",
        "data collection": "Data Collection",
        "privacy": "Privacy",
        "privacy risks": "Privacy",
        "account termination": "Account Termination",
        "termination": "Account Termination",
        "governing law": "Governing Law",
        "jurisdiction": "Governing Law",
        "indemnification": "Indemnification",
        "intellectual property": "Intellectual Property"
    }

    detected_risky_categories = set()
    for item in items:
        risk_level = item.get("risk_level", "LOW").upper()
        # Only add risk weight if the clause is determined to be risky
        if risk_level in ("MEDIUM", "HIGH", "CRITICAL"):
            raw_category = item.get("category", "").lower().strip()
            standard_category = category_mapping.get(raw_category)
            
            if not standard_category:
                # Try prefix/substring match
                for pattern, std_cat in category_mapping.items():
                    if pattern in raw_category:
                        standard_category = std_cat
                        break
                        
            if standard_category:
                detected_risky_categories.add(standard_category)
            else:
                # Direct check against standard key names
                for std_cat in weights.keys():
                    if std_cat.lower() == raw_category:
                        detected_risky_categories.add(std_cat)
                        break

    score = 0
    for cat in detected_risky_categories:
        score += weights.get(cat, 10)
        
    return min(score, 100)


async def run_analysis_pipeline(
    db: AsyncSession,
    user_id: uuid.UUID,
    text: str,
    source_type: str,
    source_url: Optional[str] = None,
    existing_document_id: Optional[uuid.UUID] = None
) -> Analysis:
    """
    Common AI analysis pipeline for T&C documents from PDF, URL, or TEXT inputs.
    """
    # Clean/Validate text input
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text too short"
        )
        
    text_len = len(text.strip())
    if text_len < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text too short"
        )

    # Quota Check (Bypassed if config.DEMO_MODE is True)
    sub_service = SubscriptionService(db)
    sub = await sub_service.get_or_create_subscription(user_id)
    usage = await sub_service.get_or_create_usage(user_id)
    
    if not config.DEMO_MODE:
        if sub.plan == "FREE" and usage.analysis_count >= FREE_PLAN_ANALYSIS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free plan limit reached. Upgrade to Pro."
            )

    # Create or Fetch Document Record
    if existing_document_id:
        doc_query = select(Document).where(Document.id == existing_document_id)
        doc_res = await db.execute(doc_query)
        doc = doc_res.scalars().first()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found."
            )
        if doc.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this document."
            )
        
        # Update source details on existing document
        doc.source_type = source_type
        doc.source_url = source_url
        db.add(doc)
        await db.commit()
    else:
        doc_id = uuid.uuid4()
        
        if source_type == "URL":
            from urllib.parse import urlparse
            try:
                parsed = urlparse(source_url)
                domain = parsed.netloc or source_url
                original_filename = f"{domain}"
            except Exception:
                original_filename = f"{source_url}"
        else:
            original_filename = "Direct Text Input"

        doc = Document(
            id=doc_id,
            user_id=user_id,
            original_filename=original_filename,
            stored_filename="",
            file_type="txt" if source_type == "TEXT" else "url",
            file_size=len(text.encode("utf-8")),
            upload_status="UPLOADED",
            storage_path="",
            processing_status="COMPLETED",
            text_extracted=True,
            extracted_text=text,
            source_type=source_type,
            source_url=source_url
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

    # Clean up any existing analysis for this document to avoid conflict
    exist_query = select(Analysis).where(Analysis.document_id == doc.id)
    exist_res = await db.execute(exist_query)
    existing_analysis = exist_res.scalars().first()
    if existing_analysis:
        await db.delete(existing_analysis)
        await db.commit()

    # Step 1: Rule-based clause detection
    detected_clauses = detect_clauses_rule_based(text)

    # Step 2: Resolve AI Service and execute analysis (hybrid), tracking time
    ai_service = AIFactory.get_service()
    
    start_time = time.time()
    try:
        result = await ai_service.analyze(text, detected_clauses)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
    processing_time = round(time.time() - start_time, 2)

    # Determine provider & model
    provider_name = "openai" if isinstance(ai_service, OpenAIService) else "mock"
    model_name = "gpt-4o-mini" if isinstance(ai_service, OpenAIService) else "mock-v1"

    # Step 3: Weighted risk scoring (Python-based)
    overall_risk_score = calculate_weighted_risk_score(result.get("items", []))

    # Save Analysis Header
    missing_clauses_val = result.get("missing_clauses", [])
    if isinstance(missing_clauses_val, (list, dict)):
        missing_clauses_str = json.dumps(missing_clauses_val)
    else:
        missing_clauses_str = str(missing_clauses_val)

    analysis = Analysis(
        document_id=doc.id,
        overall_risk_score=overall_risk_score,
        summary=result["summary"],
        recommendations=result["recommendations"],
        processing_time=processing_time,
        provider=provider_name,
        model_name=model_name,
        missing_clauses=missing_clauses_str,
        ai_explanation=result.get("ai_explanation", ""),
        confidence_score=result.get("confidence_score", 0.95)
    )

    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    # Save Analysis Items (individual clauses)
    for item in result.get("items", []):
        clause_item = AnalysisItem(
            analysis_id=analysis.id,
            title=item["title"],
            category=item["category"],
            risk_level=item["risk_level"],
            explanation=item["explanation"],
            original_text=item["original_text"],
            suggestion=item["suggestion"]
        )
        db.add(clause_item)

    await db.commit()
    await db.refresh(analysis)

    # Increment user monthly usage analysis counter (Bypassed if config.DEMO_MODE is True)
    if not config.DEMO_MODE:
        await sub_service.increment_analysis_count(user_id)

    return analysis
