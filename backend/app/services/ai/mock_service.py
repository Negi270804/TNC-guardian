import asyncio
import logging
from app.services.ai.base import BaseAIService

logger = logging.getLogger("app.services.ai.mock_service")

class MockAIService(BaseAIService):
    async def analyze(self, text: str, detected_clauses: dict = None) -> dict:
        """Simulate a legal risk audit with high-fidelity mock results for local debugging."""
        logger.info(f"Initiating Mock AI analysis. Input size: {len(text) if text else 0} chars.")
        # Mock network latency delay
        await asyncio.sleep(1.0)

        text_lower = text.lower() if text else ""
        items = []

        # 1. Check for Cancellation / Refund clauses
        if "cancel" in text_lower or "refund" in text_lower:
            items.append({
                "title": "Complicated Cancellation and Fee Retention",
                "category": "Refund Policy",
                "risk_level": "HIGH",
                "explanation": "The document specifies that cancellation requests must be sent in writing at least 30 days prior to the end of the billing period, and no partial refunds are provided.",
                "original_text": "Subscriptions must be canceled in writing at least 30 days before renewal. All fees paid are non-refundable.",
                "suggestion": "Be sure to set calendar reminders to trigger cancellation procedures at least 35 days before subscription cycles renew."
            })

        # 2. Check for Arbitration / Disputes clauses
        if "arbitration" in text_lower or "dispute" in text_lower or "court" in text_lower:
            items.append({
                "title": "Waiver of Jury Trial & Mandatory Arbitration",
                "category": "Arbitration",
                "risk_level": "CRITICAL",
                "explanation": "You agree to waive class-action access and must settle any disputes individually through binding arbitration in a predetermined jurisdiction.",
                "original_text": "Any dispute arising from these terms shall be settled solely by binding arbitration in the state of Delaware. You waive all rights to class action.",
                "suggestion": "Understand that you waive the right to seek remedies in local courts or participate in class action lawsuits against this entity."
            })

        # 3. Check for Data sharing or Partner clauses
        if "share" in text_lower or "partner" in text_lower or "advertis" in text_lower:
            items.append({
                "title": "Data Sharing with Affiliate Partners",
                "category": "Data Sharing",
                "risk_level": "MEDIUM",
                "explanation": "Your usage data, telemetry profiles, and tracking cookies are shared with affiliate marketing partners to compile targeted ads.",
                "original_text": "We share aggregated and anonymized user details with advertising affiliates for product customization.",
                "suggestion": "Inspect privacy settings and opt-out of personalized tracking and cookies inside your user account settings."
            })

        # 4. Check for Auto-renewal clauses
        if "renew" in text_lower or "automatic" in text_lower:
            items.append({
                "title": "Automatic Subscription Renewal",
                "category": "Auto Renewal",
                "risk_level": "MEDIUM",
                "explanation": "Subscribing starts automatic recurring billing charges at the end of each term unless canceled beforehand.",
                "original_text": "Upon subscription, billing automatically recurs at the start of each subsequent cycle using the saved payment method.",
                "suggestion": "Cancel the subscription immediately after purchasing if you only need the service for a single trial period."
            })

        # Fallback clause if none matched
        if not items:
            items.append({
                "title": "Standard Service Tracking",
                "category": "Data Collection",
                "risk_level": "LOW",
                "explanation": "Generic telemetry and device diagnostic attributes are collected during normal browser sessions.",
                "original_text": "We gather browser identifiers and connection speeds to improve content routing.",
                "suggestion": "Disable cookies in your browser settings if you wish to block telemetry tracking."
            })

        result = {
            "summary": "This document contains typical subscription clauses, with automated renewal charges, mandatory arbitration restrictions, and affiliate tracking permissions.",
            "recommendations": "Ensure automatic renewal is turned off and opt-out of data sharing parameters inside your dashboard settings.",
            "ai_explanation": "Overall evaluation indicates standard commercial licensing covenants. The presence of mandatory arbitration individually waives class action options, which is a major factor driving the high risk rating. Telemetry disclosures are moderate and common.",
            "confidence_score": 0.92,
            "missing_clauses": [
                {
                    "title": "Clear Opt-Out Mechanism for Data Sharing",
                    "explanation": "The terms specify that user data is shared with affiliates but do not outline a clear, user-accessible setting or contact address to opt-out of this sharing."
                },
                {
                    "title": "Detailed Refund Grace Period",
                    "explanation": "While fees are declared non-refundable, there is no mention of any cool-off period or statutory grace periods for regional consumers."
                }
            ],
            "items": items
        }
        logger.info(f"Completed Mock AI analysis. Items: {len(items)}")
        return result
