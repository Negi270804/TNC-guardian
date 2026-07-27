import json
import time
import logging
import asyncio
from app.services.ai.base import BaseAIService
from app.services.ai.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.config import OPENAI_API_KEY

logger = logging.getLogger("app.services.ai.openai_service")

class OpenAIService(BaseAIService):
    _client = None
    _client_key = None

    def __init__(self, api_key: str = OPENAI_API_KEY):
        # 1. Raise a clear configuration error if OPENAI_API_KEY is missing or invalid
        if not api_key or api_key == "" or "placeholder" in api_key.lower() or "your_openai" in api_key.lower():
            raise ValueError("[CONFIG ERROR] OpenAI API key is missing, empty, or set to placeholder value.")

        # 8. Performance: Reuse AsyncOpenAI client
        if OpenAIService._client is None or OpenAIService._client_key != api_key:
            from openai import AsyncOpenAI
            from app import config
            # 2. Configure AsyncOpenAI with an explicit timeout (default: 60)
            timeout = getattr(config, "OPENAI_TIMEOUT", 60.0)
            logger.info(f"[AI SERVICE] Initializing AsyncOpenAI client with timeout={timeout}s")
            OpenAIService._client = AsyncOpenAI(api_key=api_key, timeout=timeout)
            OpenAIService._client_key = api_key

        self.client = OpenAIService._client

    def _fill_defaults(self, result: dict) -> dict:
        """7. Response validation: fill in safe defaults for missing fields."""
        if not isinstance(result, dict):
            result = {}
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
        return result

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

        from app import config
        
        # 6. Make maximum prompt length configurable through environment variable
        max_words = getattr(config, "OPENAI_MAX_PROMPT_WORDS", 40000)
        words = text.split()
        if len(words) > max_words:
            logger.warning(f"Document text too large ({len(words)} words). Truncating to {max_words} words.")
            words = words[:max_words]
        truncated_text = " ".join(words)

        provider = "OpenAI"
        model = config.OPENAI_MODEL
        prompt_char_size = len(truncated_text)
        prompt_word_size = len(words)

        # 5. Logging: Provider, model, prompt size, analysis started
        logger.info(
            f"[AI SERVICE] Analysis started. Provider: {provider} | Model: {model} | "
            f"Prompt Size: {prompt_word_size} words ({prompt_char_size} chars)"
        )

        detected_json = json.dumps(detected_clauses or {}, indent=2)
        max_retries = 3
        last_exception = None
        raw_content = None

        # 3. Retry logic: delays [0, 2, 5]
        delays = [0, 2, 5]

        for attempt in range(max_retries):
            delay = delays[attempt]
            if delay > 0:
                logger.info(f"[AI SERVICE] Sleeping {delay}s before retry attempt {attempt + 1}")
                await asyncio.sleep(delay)

            start_time = time.time()
            try:
                logger.info(f"[AI SERVICE] OpenAI API Request: Attempt {attempt + 1}/{max_retries}")
                
                from openai import (
                    APITimeoutError,
                    RateLimitError,
                    APIStatusError,
                    APIConnectionError
                )

                response = await self.client.chat.completions.create(
                    model=model,
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

                execution_time = time.time() - start_time
                raw_content = response.choices[0].message.content or "{}"
                
                # 5. Logging: Analysis completed, execution time, retry count
                logger.info(
                    f"[AI SERVICE] Analysis completed successfully. Provider: {provider} | "
                    f"Model: {model} | Execution Time: {execution_time:.2f}s | "
                    f"Retries: {attempt}"
                )
                
                try:
                    result = json.loads(raw_content)
                except json.JSONDecodeError as json_err:
                    # 7. Malformed JSON handling: attempt to clean markdown formatting
                    logger.warning(f"[AI SERVICE] [JSON DECODE ERROR] Malformed JSON received on attempt {attempt + 1}: {str(json_err)}")
                    cleaned_content = raw_content.strip()
                    import re
                    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", cleaned_content, re.DOTALL | re.IGNORECASE)
                    if match:
                        cleaned_content = match.group(1).strip()
                    result = json.loads(cleaned_content)
                
                return self._fill_defaults(result)

            # 4. Improve exception handling - Handle separately
            except APITimeoutError as e:
                logger.error(f"[AI SERVICE] [TIMEOUT] Request timed out on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except RateLimitError as e:
                logger.error(f"[AI SERVICE] [RATE LIMIT] Rate limit exceeded on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except APIConnectionError as e:
                logger.error(f"[AI SERVICE] [CONNECTION ERROR] Network failure or API unreachable on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except APIStatusError as e:
                from openai import AuthenticationError
                if e.status_code == 401 or isinstance(e, AuthenticationError):
                    logger.error(f"[AI SERVICE] [AUTH ERROR] Authentication failed (401) on attempt {attempt + 1}: {str(e)}")
                    raise e
                elif e.status_code >= 500:
                    logger.error(f"[AI SERVICE] [SERVER ERROR] OpenAI Internal Server Error ({e.status_code}) on attempt {attempt + 1}: {str(e)}")
                    last_exception = e
                else:
                    logger.error(f"[AI SERVICE] [API ERROR] OpenAI API returned status {e.status_code} on attempt {attempt + 1}: {str(e)}")
                    raise e
            except json.JSONDecodeError as e:
                logger.error(f"[AI SERVICE] [JSON DECODE ERROR] Failed to parse content on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except Exception as e:
                logger.error(f"[AI SERVICE] [UNEXPECTED ERROR] Unexpected failure on attempt {attempt + 1}: {str(e)}")
                raise e

        # If we failed all attempts, try to return safe defaults if we managed to get raw_content
        if raw_content:
            logger.warning("[AI SERVICE] Returning safe default dictionary because response was received but could not be parsed.")
            return self._fill_defaults({})

        # 5. Logging: Failure reason
        logger.critical(f"[AI SERVICE] Analysis failed after {max_retries} attempts. Provider: {provider} | Model: {model} | Failure Reason: {str(last_exception)}")
        raise RuntimeError(f"OpenAI service failed after {max_retries} attempts: {str(last_exception)}")
