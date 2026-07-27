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
        from app import config
        api_key = getattr(config, "OPENAI_API_KEY", "")
        has_key = (
            api_key is not None and 
            api_key != "" and
            "placeholder" not in api_key.lower() and
            "your_openai" not in api_key.lower()
        )

        if has_key:
            logger.info("[AI FACTORY] Active Service Provider: OpenAIService (GPT-4o-mini)")
            return OpenAIService(api_key)
        else:
            logger.info("[AI FACTORY] Active Service Provider: MockAIService (Offline Mock Fallback)")
            return MockAIService()
