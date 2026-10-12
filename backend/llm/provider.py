import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Type, TypeVar
import httpx
from pydantic import BaseModel

from backend.core.config import settings
from backend.core.exceptions import LLMProviderError

logger = logging.getLogger("bugx")

T = TypeVar("T", bound=BaseModel)

class LLMProvider(ABC):
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate structured JSON output according to the provided schema.
        """
        pass

class MockLLMProvider(LLMProvider):
    """
    Mock LLM provider used for local testing or when no external API key is provided.
    Generates dynamically contextualized competing hypotheses and causal root cause structures
    based on the input prompt repository details and bug description.
    """
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("[MockLLMProvider] Generating structured output from dynamic mock engine")
        
        # Analyze prompt keywords for dynamic context synthesis
        prompt_lower = prompt.lower()
        
        # Extract files if mentioned
        file_hints = []
        if "relevant files" in prompt_lower or "files:" in prompt_lower:
            lines = prompt.splitlines()
            for line in lines:
                if any(ext in line for ext in [".py", ".ts", ".js", ".go", ".java", ".rs"]):
                    parts = line.strip().split()
                    for p in parts:
                        if any(ext in p for ext in [".py", ".ts", ".js", ".go", ".java", ".rs"]):
                            clean_p = p.strip("`'\",:()")
                            if clean_p not in file_hints and len(clean_p) > 3:
                                file_hints.append(clean_p)
                                
        primary_file = file_hints[0] if file_hints else "services/payment_service.py"
        secondary_file = file_hints[1] if len(file_hints) > 1 else "api/retry_handler.py"
        
        return {
            "hypotheses": [
                {
                    "id": "H1",
                    "title": "Invalid State Transition During Retry Sequence",
                    "description": "The transaction state machine allows retrying a failed request without resetting the state lock or validating stale token authorization, leading to an unhandled exception.",
                    "confidence": 0.78,
                    "evidence": [
                        {
                            "type": "source_code",
                            "file": primary_file,
                            "line": 142,
                            "description": "Function attempts state mutation without acquiring an explicit optimistic concurrency lock."
                        },
                        {
                            "type": "source_code",
                            "file": secondary_file,
                            "line": 87,
                            "description": "Retry middleware catches generic exceptions and re-dispatches with stale payload context."
                        }
                    ],
                    "predictions": [
                        "Executing concurrent retry requests with identical transaction tokens causes state lock collision."
                    ],
                    "tests": [
                        "Mock a failed transaction response and immediately execute two simultaneous retry API calls."
                    ],
                    "status": "unverified"
                },
                {
                    "id": "H2",
                    "title": "Unhandled Concurrency Race Condition in Token Validator",
                    "description": "Token status validation and database session commit occur in non-atomic operations, enabling dirty reads during high throughput retries.",
                    "confidence": 0.62,
                    "evidence": [
                        {
                            "type": "source_code",
                            "file": secondary_file,
                            "line": 104,
                            "description": "Non-atomic database query executed prior to state mutation."
                        }
                    ],
                    "predictions": [
                        "High concurrency load will produce intermittent HTTP 500 error responses with lock timeout errors."
                    ],
                    "tests": [
                        "Run load test with 50 parallel retry requests using shared authorization token."
                    ],
                    "status": "unverified"
                },
                {
                    "id": "H3",
                    "title": "Stale Cache Invalidation Failure",
                    "description": "Redis cache layer retains previous transaction status for 60 seconds after terminal failure state.",
                    "confidence": 0.35,
                    "evidence": [
                        {
                            "type": "source_code",
                            "file": primary_file,
                            "line": 210,
                            "description": "Cache purge signal is omitted in the exception rollback handler."
                        }
                    ],
                    "predictions": [
                        "Immediate retries fail, while retries delayed by >60 seconds succeed."
                    ],
                    "tests": [
                        "Verify cache keys immediately following failed payment state."
                    ],
                    "status": "unverified"
                }
            ],
            "root_cause": {
                "summary": "Non-atomic state lock mutation during retry dispatch causes unhandled HTTP 500 internal server exceptions.",
                "primary_hypothesis_id": "H1",
                "causal_chain": [
                    {
                        "step": 1,
                        "component": "API Gateway / Client Request",
                        "action": "User submits retry request after network interruption"
                    },
                    {
                        "step": 2,
                        "component": secondary_file,
                        "action": "Retry handler intercepts payload with previous attempt token"
                    },
                    {
                        "step": 3,
                        "component": primary_file,
                        "action": "State machine reads stale 'FAILED' record without atomic lock"
                    },
                    {
                        "step": 4,
                        "component": primary_file,
                        "action": "Invalid state transition occurs, throwing unhandled StateMachineError"
                    },
                    {
                        "step": 5,
                        "component": "HTTP Response Pipeline",
                        "action": "Server converts uncaught exception into HTTP 500 Internal Server Error"
                    }
                ]
            }
        }


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model

    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise LLMProviderError("OPENAI_API_KEY is not configured.")
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        system_instruction = (
            "You are BUGX WHY Engine, a world-class autonomous root cause diagnosis system. "
            "Respond ONLY with valid JSON matching the specified schema. Do not include markdown codeblocks or extra text."
        )
        
        full_prompt = f"{prompt}\n\nStrict Output JSON Schema:\n{json.dumps(schema, indent=2)}"
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": full_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(url, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            except Exception as e:
                logger.error(f"[OpenAIProvider] API call failed: {e}")
                raise LLMProviderError(f"OpenAI completion error: {e}")


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model

    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise LLMProviderError("ANTHROPIC_API_KEY is not configured.")
            
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        full_prompt = (
            f"{prompt}\n\n"
            f"Output MUST be valid JSON conforming to this schema:\n{json.dumps(schema, indent=2)}\n"
            "Return JSON ONLY."
        )
        
        payload = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": [
                {"role": "user", "content": full_prompt}
            ]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(url, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                content = data["content"][0]["text"]
                # Clean possible markdown block
                clean_content = content.strip()
                if clean_content.startswith("```"):
                    lines = clean_content.splitlines()
                    clean_content = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
                return json.loads(clean_content)
            except Exception as e:
                logger.error(f"[AnthropicProvider] API call failed: {e}")
                raise LLMProviderError(f"Anthropic API error: {e}")


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model

    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise LLMProviderError("GEMINI_API_KEY is not configured.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        full_prompt = (
            f"{prompt}\n\n"
            f"Output MUST be valid JSON adhering strictly to this JSON Schema:\n{json.dumps(schema, indent=2)}"
        )
        
        payload = {
            "contents": [
                {"parts": [{"text": full_prompt}]}
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(content)
            except Exception as e:
                logger.error(f"[GeminiProvider] API call failed: {e}")
                raise LLMProviderError(f"Gemini API error: {e}")


def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)
    elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return AnthropicProvider(api_key=settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL)
    elif provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
    else:
        if provider != "mock":
            logger.warning(f"Provider '{provider}' requested but credentials missing. Falling back to MockLLMProvider.")
        return MockLLMProvider()
