import logging
from app.config import OPENAI_API_KEY
from app.services.ai.base import BaseAIService
from app.services.ai.openai_service import OpenAIService
from app.services.ai.mock_service import MockAIService

logger = logging.getLogger("app.services.ai.factory")

class AIFactory:
    @staticmethod
    def get_service() -> BaseAIService:
        """Determines the active AI service implementation based on key availability."""
        has_key = (
            OPENAI_API_KEY is not None and 
            OPENAI_API_KEY != "" and
            "placeholder" not in OPENAI_API_KEY.lower() and
            "your_openai" not in OPENAI_API_KEY.lower()
        )

        if has_key:
            logger.info("[AI FACTORY] Active Service Provider: OpenAIService (GPT-4o-mini)")
            return OpenAIService()
        else:
            logger.info("[AI FACTORY] Active Service Provider: MockAIService (Offline Mock Fallback)")
            return MockAIService()
