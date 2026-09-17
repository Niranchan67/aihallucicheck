"""
config.py
---------
Centralised application configuration for HalluciCheck.

All external API keys and runtime settings are loaded from environment
variables (typically via a .env file at the project root). Nothing in
this module ever talks to the network -- it only describes what is
available so the rest of the app can decide which code path to run.
"""

import os
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel


def _load_dotenv(path: str = ".env") -> None:
    """Minimal .env loader so the app works without python-dotenv installed.

    If python-dotenv IS installed, we prefer it (it handles quoting/escaping
    better). Otherwise we fall back to a tiny hand-rolled parser.
    """
    target_path = path
    if not os.path.exists(target_path):
        candidate = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(candidate):
            target_path = candidate

    try:
        from dotenv import load_dotenv  # type: ignore

        load_dotenv(target_path)
        return
    except ImportError:
        pass

    if not os.path.exists(target_path):
        return

    with open(target_path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


_load_dotenv()


class Settings(BaseModel):
    # --- Server ---
    port: int = int(os.getenv("PORT", "8000"))
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5500")
    environment: str = os.getenv("ENVIRONMENT", "development")

    # --- LLM providers (used for claim classification / judgement) ---
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY") or None
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY") or None

    # --- Live web / academic search providers (used for evidence retrieval) ---
    tavily_api_key: Optional[str] = os.getenv("TAVILY_API_KEY") or None
    serpapi_api_key: Optional[str] = os.getenv("SERPAPI_API_KEY") or None

    # --- Behaviour flags ---
    max_input_chars: int = int(os.getenv("MAX_INPUT_CHARS", "5000"))
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "8"))
    max_claims_per_request: int = int(os.getenv("MAX_CLAIMS_PER_REQUEST", "40"))

    @property
    def has_search_provider(self) -> bool:
        return bool(self.tavily_api_key or self.serpapi_api_key)

    @property
    def has_llm_provider(self) -> bool:
        return bool(self.openai_api_key or self.anthropic_api_key)

    @property
    def demo_mode(self) -> bool:
        """True only when no external evidence/LLM provider is configured.

        HalluciCheck always has a free, keyless Wikipedia evidence path, so
        normal installations can verify against real source pages without API keys.
        """
        return False

    def provider_status(self) -> dict:
        return {
            "openai": "connected" if self.openai_api_key else "not_configured",
            "anthropic": "connected" if self.anthropic_api_key else "not_configured",
            "tavily": "connected" if self.tavily_api_key else "not_configured",
            "serpapi": "connected" if self.serpapi_api_key else "not_configured",
            "demo_mode": self.demo_mode,
            "wikipedia": "connected (no key required)",
        }


@lru_cache
def get_settings() -> "Settings":
    return Settings()
