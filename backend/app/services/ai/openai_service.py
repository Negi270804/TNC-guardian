import json
from openai import AsyncOpenAI
from app.services.ai.base import BaseAIService
from app.services.ai.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.config import OPENAI_API_KEY

class OpenAIService(BaseAIService):
    def __init__(self, api_key: str = OPENAI_API_KEY):
        self.client = AsyncOpenAI(api_key=api_key or "placeholder_key")

    async def analyze(self, text: str) -> dict:
        """Analyze terms and conditions using OpenAI GPT model endpoints."""
        if not text or not text.strip():
            return {
                "overall_risk_score": 0,
                "summary": "Document text was empty. No analysis could be run.",
                "recommendations": "Upload a non-empty document.",
                "items": []
            }

        # Truncate text to avoid context limits (safe boundary of first 12,000 words)
        words = text.split()
        if len(words) > 12000:
            words = words[:12000]
        truncated_text = " ".join(words)

        max_retries = 3
        last_exception = None

        for attempt in range(max_retries):
            try:
                # Dispatch async chat completion payload requesting structured JSON formats
                response = await self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": USER_PROMPT_TEMPLATE.format(document_text=truncated_text)}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )

                raw_content = response.choices[0].message.content or "{}"
                result = json.loads(raw_content)

                # Validate expected response properties are present
                if "overall_risk_score" not in result:
                    result["overall_risk_score"] = 40
                if "summary" not in result:
                    result["summary"] = "AI summary generation yielded empty outputs."
                if "recommendations" not in result:
                    result["recommendations"] = "Review terms and conditions text details manually."
                if "items" not in result:
                    result["items"] = []

                return result
            except json.JSONDecodeError as json_err:
                print(f"[OpenAI SERVICE] JSON decode failure on attempt {attempt+1}: {str(json_err)}")
                last_exception = json_err
            except Exception as conn_err:
                print(f"[OpenAI SERVICE] Connection failure on attempt {attempt+1}: {str(conn_err)}")
                last_exception = conn_err

        # Raise exception if retry attempts fail
        raise RuntimeError(f"OpenAI service failed after {max_retries} attempts: {str(last_exception)}")
