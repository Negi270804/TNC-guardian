import logging
from app.services.ai.base import BaseAIService
from app.services.ai.openai_service import OpenAIService
from app.services.ai.mock_service import MockAIService

logger = logging.getLogger("app.services.ai.factory")

class AIFactory:
    """
    Factory class responsible for instantiating and providing the correct active AI service.
    
    Routes traffic either to OpenAIService (if key is present and enabled) or to 
    MockAIService (if key is absent and mock fallback is enabled).
    """

    @staticmethod
    def get_service() -> BaseAIService:
        """
        Resolves and instantiates the appropriate BaseAIService implementation.
        
        Uses config parameters (ENABLE_OPENAI, ENABLE_MOCK_FALLBACK) and API key
        validity checks to choose between OpenAIService and MockAIService.
        
        Returns:
            BaseAIService: The initialized active AI service instance.
            
        Raises:
            RuntimeError: If no AI provider is available due to configuration flags.
        """
        from app import config
        api_key = getattr(config, "OPENAI_API_KEY", "")
        has_key = (
            api_key is not None and 
            api_key != "" and
            "placeholder" not in api_key.lower() and
            "your_openai" not in api_key.lower()
        )

        enable_openai = getattr(config, "ENABLE_OPENAI", True)
        enable_mock = getattr(config, "ENABLE_MOCK_FALLBACK", True)

        if enable_openai and has_key:
            logger.info("[AI FACTORY] Active Service Provider: OpenAIService (GPT-4o-mini)")
            return OpenAIService(api_key)
        elif enable_mock:
            logger.info("[AI FACTORY] Active Service Provider: MockAIService (Offline Mock Fallback)")
            return MockAIService()
        else:
            raise RuntimeError("No AI service available. Both OpenAI and Mock Fallback are disabled.")
