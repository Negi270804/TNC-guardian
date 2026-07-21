from abc import ABC, abstractmethod

class BaseAIService(ABC):
    @abstractmethod
    async def analyze(self, text: str) -> dict:
        """
        Analyze extracted Terms & Conditions or Privacy Policy text.
        
        Returns a dictionary conforming to the structured analysis schemas:
        {
            "overall_risk_score": int, (0-100)
            "summary": str,
            "recommendations": str,
            "items": [
                {
                    "title": str,
                    "category": str,
                    "risk_level": str, # LOW, MEDIUM, HIGH, CRITICAL
                    "explanation": str,
                    "original_text": str,
                    "suggestion": str
                }
            ]
        }
        """
        pass
