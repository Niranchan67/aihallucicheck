"""
llm_verifier.py
---------------
Real LLM-Powered Factual Verification Engine.

Combines ground-truth evidence gathered across multi-source repositories
(Wikipedia, DuckDuckGo, CrossRef, Europe PMC, OpenAlex, ArXiv) with
frontier LLMs (Google Gemini, Groq Llama 3.3, OpenAI GPT-4o-mini).

Provides:
- Natural-language reasoning and contextual comprehension.
- Nuanced evidence entailment without brittle regex/keyword heuristics.
- Precise factual contradiction detection.
- Grounded citations and exact source quotation.
"""

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import List, Optional
import httpx

from schemas import ClaimStatus

logger = logging.getLogger("hallucicheck.llm_verifier")


@dataclass
class LLMVerificationResult:
    status: ClaimStatus
    confidence: float
    reasoning: str
    primary_quote: str
    primary_source_name: str
    primary_source_url: str


def _get_active_api_keys(user_key: Optional[str] = None) -> dict:
    """Detects available LLM credentials from user request or environment."""
    keys = {
        "gemini": user_key if (user_key and user_key.startswith("AIzaSy")) else (os.getenv("GEMINI_API_KEY") or ""),
        "groq": user_key if (user_key and user_key.startswith("gsk_")) else (os.getenv("GROQ_API_KEY") or ""),
        "openai": user_key if (user_key and user_key.startswith("sk-")) else (os.getenv("OPENAI_API_KEY") or ""),
    }
    # If a generic key was passed in user_key, try to assign by format
    if user_key and not any(keys.values()):
        if user_key.startswith("gsk_"):
            keys["groq"] = user_key
        elif user_key.startswith("sk-"):
            keys["openai"] = user_key
        else:
            keys["gemini"] = user_key
    return keys


def format_evidence_context(evidence_pool: list, max_sources: int = 5) -> str:
    """Formats retrieved multi-source evidence into structured context for the LLM."""
    if not evidence_pool:
        return "No external source passages were found in web/scholarly repositories."

    lines = []
    seen = set()
    count = 0
    for ev in evidence_pool:
        url = getattr(ev, "source_url", "")
        if url in seen:
            continue
        seen.add(url)
        name = getattr(ev, "source_name", "Authoritative Source")
        title = getattr(ev, "title", "")
        snippet = getattr(ev, "snippet", "")
        if snippet:
            count += 1
            lines.append(
                f"[Source #{count}: {name}]\n"
                f"Title: {title}\n"
                f"URL: {url}\n"
                f"Excerpt: {snippet}\n"
            )
            if count >= max_sources:
                break
    return "\n".join(lines)


SYSTEM_PROMPT = """You are HalluciCheck's Autonomous Fact-Checking & LLM Entailment Engine.
Your job is to rigorously evaluate an assertion using provided ground-truth evidence retrieved from authoritative scientific, medical, and encyclopedic repositories.

You must determine whether the assertion is:
1. "VERIFIED": Fully substantiated by factual evidence from reliable sources with no contradictions.
2. "HALLUCINATED": Directly contradicted by facts, contains fabricated dates/numbers/discoverers/attributions, or asserts things physically or historically untrue.
3. "SUSPICIOUS": Partially true but contains unverified or exaggerated qualifiers, conflicting evidence, or lacks sufficient authoritative confirmation.

Rules:
- Be scientifically, historically, and logically rigorous.
- Never make up information. Base your decision strictly on the provided evidence excerpts and foundational world facts.
- Produce deep, lucid, human-grade reasoning explaining the factual mechanism, context, and why the claim is true or false.
- Pick or quote the single most compelling evidence sentence as primary_quote.
- Ensure confidence is an authentic percentage between 0.0 and 100.0 (e.g. 97.5 for verified, 12.0 for hallucinated, 45.0 for suspicious).

Output ONLY a single valid JSON object with these exact keys:
{
  "status": "VERIFIED" | "SUSPICIOUS" | "HALLUCINATED",
  "confidence": 94.5,
  "reasoning": "Detailed factual explanation...",
  "primary_quote": "Exact supporting or contradicting quote from evidence...",
  "primary_source_name": "Source Name",
  "primary_source_url": "Source URL"
}"""


async def verify_with_gemini(claim_text: str, evidence_text: str, api_key: str) -> Optional[LLMVerificationResult]:
    """Queries Google Gemini 1.5/2.0 Flash via REST API."""
    user_prompt = f"""EVALUATE THIS ASSERTION:
"{claim_text}"

RETRIEVED MULTI-SOURCE EVIDENCE:
{evidence_text}

Respond in the required JSON format."""

    # Try gemini-1.5-flash first, fallback to gemini-2.0-flash
    models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}]}
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = _parse_llm_json(raw_content)
                        if parsed:
                            return parsed
                else:
                    logger.warning(f"Gemini {model} returned status {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"Error querying Gemini {model}: {e}")
    return None


async def verify_with_groq(claim_text: str, evidence_text: str, api_key: str) -> Optional[LLMVerificationResult]:
    """Queries Groq Llama-3.3-70B via ultra-fast REST API."""
    user_prompt = f"""EVALUATE THIS ASSERTION:
"{claim_text}"

RETRIEVED MULTI-SOURCE EVIDENCE:
{evidence_text}

Respond in the required JSON format."""

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return _parse_llm_json(raw_content)
            else:
                logger.warning(f"Groq API returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"Error querying Groq: {e}")
    return None


async def verify_with_openai(claim_text: str, evidence_text: str, api_key: str) -> Optional[LLMVerificationResult]:
    """Queries OpenAI GPT-4o-mini via REST API."""
    user_prompt = f"""EVALUATE THIS ASSERTION:
"{claim_text}"

RETRIEVED MULTI-SOURCE EVIDENCE:
{evidence_text}

Respond in the required JSON format."""

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return _parse_llm_json(raw_content)
            else:
                logger.warning(f"OpenAI returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"Error querying OpenAI: {e}")
    return None


def _parse_llm_json(raw_text: str) -> Optional[LLMVerificationResult]:
    """Safely parses structured JSON response from an LLM."""
    if not raw_text:
        return None
    try:
        # Strip code markdown block if present
        clean = re.sub(r"^```json\s*", "", raw_text.strip(), flags=re.IGNORECASE)
        clean = re.sub(r"^```\s*", "", clean)
        clean = re.sub(r"```$", "", clean).strip()
        data = json.loads(clean)

        status_str = str(data.get("status", "")).upper()
        if "VERIF" in status_str:
            status = ClaimStatus.VERIFIED
        elif "HALLUC" in status_str or "CONTRAD" in status_str:
            status = ClaimStatus.HALLUCINATED
        else:
            status = ClaimStatus.SUSPICIOUS

        conf = float(data.get("confidence", 75.0))
        conf = max(1.0, min(99.4, round(conf, 1)))

        reasoning = str(data.get("reasoning", "")).strip()
        quote = str(data.get("primary_quote", "")).strip()
        src_name = str(data.get("primary_source_name", "Authoritative Multi-Source Consensus")).strip()
        src_url = str(data.get("primary_source_url", "")).strip()

        return LLMVerificationResult(
            status=status,
            confidence=conf,
            reasoning=reasoning,
            primary_quote=quote,
            primary_source_name=src_name,
            primary_source_url=src_url,
        )
    except Exception as e:
        logger.warning(f"Failed to parse LLM JSON: {e} | Raw: {raw_text[:200]}")
        return None


async def verify_claim_with_llm(
    claim_text: str,
    evidence_pool: list,
    user_api_key: Optional[str] = None,
) -> Optional[LLMVerificationResult]:
    """
    Main entry point for LLM verification.
    Attempts verification via available LLM provider in order of speed/efficiency.
    """
    keys = _get_active_api_keys(user_api_key)
    evidence_text = format_evidence_context(evidence_pool)

    # 1. Try Groq (ultra-fast Llama-3.3-70B)
    if keys["groq"]:
        res = await verify_with_groq(claim_text, evidence_text, keys["groq"])
        if res:
            return res

    # 2. Try Google Gemini (Gemini 1.5/2.0 Flash)
    if keys["gemini"]:
        res = await verify_with_gemini(claim_text, evidence_text, keys["gemini"])
        if res:
            return res

    # 3. Try OpenAI (GPT-4o-mini)
    if keys["openai"]:
        res = await verify_with_openai(claim_text, evidence_text, keys["openai"])
        if res:
            return res

    return None
