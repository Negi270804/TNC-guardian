import json
import time
import logging
from openai import AsyncOpenAI
from app.services.ai.base import BaseAIService
from app.services.ai.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.config import OPENAI_API_KEY

logger = logging.getLogger("app.services.ai.openai_service")

class OpenAIService(BaseAIService):
    def __init__(self, api_key: str = OPENAI_API_KEY):
        self.client = AsyncOpenAI(api_key=api_key or "placeholder_key")

    async def analyze(self, text: str, detected_clauses: dict = None) -> dict:
        """Analyze terms and conditions using OpenAI GPT model endpoints."""
        if not text or not text.strip() or len(text.strip()) < 100:
            logger.info("Skipping analysis: Input text is empty or too short.")
            return {
                "overall_risk_score": 0,
                "summary": "Document text was empty or too short. No analysis could be run.",
                "recommendations": "Upload a non-empty document of at least 100 characters.",
                "ai_explanation": "Execution bypassed due to insufficient text content.",
                "confidence_score": 1.0,
                "missing_clauses": [],
                "items": []
            }

        # Truncate text to avoid context limits (safe boundary of first 40,000 words for GPT-4o-mini)
        words = text.split()
        if len(words) > 40000:
            logger.warning(f"Document text too large ({len(words)} words). Truncating to 40,000 words.")
            words = words[:40000]
        truncated_text = " ".join(words)

        max_retries = 3
        last_exception = None

        logger.info(f"Initiating AI analysis. Word count: {len(words)} (characters: {len(text)}).")

        detected_json = json.dumps(detected_clauses or {}, indent=2)

        for attempt in range(max_retries):
            start_time = time.time()
            try:
                logger.info(f"OpenAI API Request: Attempt {attempt + 1}/{max_retries}")
                # Dispatch async chat completion payload requesting structured JSON formats
                response = await self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
                            document_text=truncated_text,
                            detected_clauses_json=detected_json
                        )}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )

                elapsed_time = time.time() - start_time
                raw_content = response.choices[0].message.content or "{}"
                logger.info(f"OpenAI API Response received in {elapsed_time:.2f}s. Size: {len(raw_content)} chars.")
                logger.debug(f"Raw response: {raw_content}")

                result = json.loads(raw_content)

                # Validate expected response properties are present
                if "overall_risk_score" not in result:
                    result["overall_risk_score"] = 40
                if "summary" not in result:
                    result["summary"] = "AI summary generation yielded empty outputs."
                if "recommendations" not in result:
                    result["recommendations"] = "Review terms and conditions text details manually."
                if "ai_explanation" not in result:
                    result["ai_explanation"] = "An overall analysis of risk terms is not available."
                if "confidence_score" not in result:
                    result["confidence_score"] = 0.95
                if "missing_clauses" not in result:
                    result["missing_clauses"] = []
                if "items" not in result:
                    result["items"] = []

                logger.info(f"Successfully parsed AI response. Score: {result['overall_risk_score']}. Items count: {len(result['items'])}.")
                return result

            except json.JSONDecodeError as json_err:
                logger.error(f"JSON decode failure on attempt {attempt + 1}: {str(json_err)}")
                last_exception = json_err
            except Exception as conn_err:
                logger.error(f"OpenAI Connection failure on attempt {attempt + 1}: {str(conn_err)}")
                last_exception = conn_err

        # Raise exception if retry attempts fail
        logger.critical(f"OpenAI service failed all {max_retries} attempts.")
        raise RuntimeError(f"OpenAI service failed after {max_retries} attempts: {str(last_exception)}")
