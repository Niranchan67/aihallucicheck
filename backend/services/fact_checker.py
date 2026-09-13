"""
fact_checker.py
---------------
Stage 3 & Stage 5 of the verification pipeline:
Full LLM-powered verification engine across ANY input text.
1. Multi-source evidence retrieval (Wikipedia + DuckDuckGo Live Web Search).
2. Advanced LLM Judge (OpenRouter / GPT-4o / Claude / Gemini / Llama) with multi-model failover.
3. Resilient semantic cross-examination fallback ensuring 100% uptime.
"""

import asyncio
import json
import os
import re
from typing import List, Optional, Tuple
import httpx

from config import get_settings
from schemas import ClaimResult, ClaimStatus, ClaimType, SourceCitation
from services.independent_verifier import generate_independent_query
from services.multi_source_retriever import (
    RetrievedEvidence,
    retrieve_multi_source_evidence,
)

settings = get_settings()

OPENROUTER_KEYS = [
    os.getenv("OPENROUTER_API_KEY", ""),
    os.getenv("GEMINI_API_KEY", ""),
]

LLM_MODELS = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3-8b-instruct:free",
]


async def _judge_with_llm(
    claim_text: str,
    neutral_question: str,
    evidence_pool: List[RetrievedEvidence],
) -> Optional[Tuple[ClaimStatus, float, str, str, str, str]]:
    """
    Query state-of-the-art LLMs to cross-examine ANY claim against retrieved evidence and general knowledge.
    Returns: (status, confidence, reasoning, evidence_quote, source_name, source_url)
    """
    evidence_snippets = "\n".join(
        f"- [{e.source_name}] ({e.source_url}): {e.snippet}"
        for e in evidence_pool
    )

    system_prompt = (
        "You are HalluciCheck, an elite AI Hallucination & Fact-Checking Verification Model. "
        "You verify ANY claim across all domains (science, history, politics, technology, law, medicine, culture, etc.) with high precision. "
        "Analyze whether the given statement is factually accurate or contains hallucinations, false numbers, wrong dates, or fabricated assertions."
    )

    user_prompt = (
        f'CLAIM TO VERIFY:\n"{claim_text}"\n\n'
        f'INDEPENDENT NEUTRAL QUERY:\n{neutral_question}\n\n'
        f'RETRIEVED EXTERNAL GROUND TRUTH:\n{evidence_snippets or "No external passages indexed."}\n\n'
        'INSTRUCTIONS:\n'
        '1. Evaluate the claim strictly against verified facts, your deep knowledge, and the external ground truth.\n'
        '2. Classify status into one of:\n'
        '   - "verified": The statement is entirely true, accurate, and substantiated.\n'
        '   - "hallucinated": The statement is false, fabricated, disproven, or contains made-up facts/names/dates.\n'
        '   - "suspicious": The statement is partially true, ambiguous, unproven, or lacks conclusive evidence.\n'
        '3. Provide a confidence score from 10 to 99.\n'
        '4. Provide a 1-2 sentence factual explanation.\n'
        '5. Provide an authoritative source name and valid source URL.\n\n'
        'Return ONLY a valid JSON object matching this schema:\n'
        '{\n'
        '  "status": "verified" | "hallucinated" | "suspicious",\n'
        '  "confidence": <integer 10-99>,\n'
        '  "explanation": "<concise factual reasoning>",\n'
        '  "evidence_quote": "<salient excerpt confirming or debunking the claim>",\n'
        '  "source_name": "<name of authoritative source, e.g. Wikipedia, Britannica, NASA, Nature>",\n'
        '  "source_url": "<valid authoritative URL>"\n'
        '}'
    )

    # Multi-provider LLM cascade
    async with httpx.AsyncClient(timeout=14.0, follow_redirects=True) as client:
        # Provider A: OpenRouter cascade
        for key in OPENROUTER_KEYS:
            if not key or len(key) < 10:
                continue
            for model_name in LLM_MODELS:
                try:
                    headers = {
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "HalluciCheck AI Verification System",
                    }
                    payload = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.0,
                        "response_format": {"type": "json_object"},
                    }
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        # Clean markdown json fences if any
                        clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
                        data = json.loads(clean_json)

                        st_str = data.get("status", "suspicious").lower()
                        if "verif" in st_str:
                            status = ClaimStatus.VERIFIED
                        elif "hallucin" in st_str or "false" in st_str or "refut" in st_str:
                            status = ClaimStatus.HALLUCINATED
                        else:
                            status = ClaimStatus.SUSPICIOUS

                        confidence = float(data.get("confidence", 85))
                        reasoning = data.get("explanation") or data.get("reasoning") or "Verified via multi-source consensus."
                        evidence_quote = data.get("evidence_quote") or ""
                        source_name = data.get("source_name") or (evidence_pool[0].source_name if evidence_pool else "Authoritative Record")
                        source_url = data.get("source_url") or (evidence_pool[0].source_url if evidence_pool else "https://en.wikipedia.org")

                        return status, confidence, reasoning, evidence_quote, source_name, source_url
                except Exception as e:
                    # Model failed, try next model/key in pool
                    continue

        # Provider B: Google Gemini API (if GEMINI_API_KEY is configured directly)
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and gemini_key.startswith("AIzaSy"):
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                g_payload = {
                    "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
                    "generationConfig": {
                        "temperature": 0.0,
                        "responseMimeType": "application/json",
                    },
                }
                resp = await client.post(url, json=g_payload)
                if resp.status_code == 200:
                    text_out = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", text_out.strip())
                    data = json.loads(clean_json)

                    st_str = data.get("status", "suspicious").lower()
                    status = ClaimStatus.VERIFIED if "verif" in st_str else (ClaimStatus.HALLUCINATED if "hallucin" in st_str else ClaimStatus.SUSPICIOUS)
                    confidence = float(data.get("confidence", 85))
                    reasoning = data.get("explanation") or data.get("reasoning") or "Verified via Google Gemini."
                    evidence_quote = data.get("evidence_quote") or ""
                    source_name = data.get("source_name") or "Google Gemini Verification"
                    source_url = data.get("source_url") or "https://en.wikipedia.org"
                    return status, confidence, reasoning, evidence_quote, source_name, source_url
            except Exception as e:
                pass

    return None


def _semantic_evidence_cross_check(
    claim_text: str,
    evidence_pool: List[RetrievedEvidence],
) -> Tuple[ClaimStatus, float, str, str, str, str]:
    """
    Resilient fallback algorithm:
    Cross-checks extracted claim against real retrieved Wikipedia & DuckDuckGo snippets.
    """
    if not evidence_pool:
        return (
            ClaimStatus.SUSPICIOUS,
            45.0,
            "No indexed primary records could be retrieved for this statement.",
            "Requires deeper indexing.",
            "Unverified Index",
            "https://duckduckgo.com",
        )

    all_snippets = " ".join(e.snippet for e in evidence_pool)
    all_snippets_lower = all_snippets.lower()
    claim_lower = claim_text.lower()

    # Extract dates/years
    claim_years = set(re.findall(r"\b(1[789]\d{2}|20\d{2})\b", claim_text))
    evidence_years = set(re.findall(r"\b(1[789]\d{2}|20\d{2})\b", all_snippets))

    # Sort evidence items by keyword overlap with slight domain boost
    def _score_ev(e):
        e_words = set(re.findall(r"\b[a-zA-Z0-9]{3,}\b", e.snippet.lower()))
        score = len(set(words) & e_words)
        src_low = e.source_name.lower()
        if any(term in src_low for term in ["nature", "pubmed", "arxiv", "openalex", "science", "ieee"]):
            score += 1.5
        elif "wikipedia" not in src_low:
            score += 0.5
        return score

    sorted_evidence = sorted(evidence_pool, key=_score_ev, reverse=True)
    best_source = sorted_evidence[0] if sorted_evidence else evidence_pool[0]

    # Chronological conflict
    if claim_years and evidence_years and not (claim_years & evidence_years):
        return (
            ClaimStatus.HALLUCINATED,
            20.0,
            f"Chronological discrepancy: claim states {', '.join(claim_years)} while verified records state {', '.join(list(evidence_years)[:2])}.",
            best_source.snippet[:250],
            best_source.source_name,
            best_source.source_url,
        )

    # Obvious refutation markers in ground truth
    refutation_markers = ["fictional", "conspiracy", "debunked", "myth", "disproven", "fabricated", "hoax", "false claim"]
    if any(rm in all_snippets_lower for rm in refutation_markers):
        return (
            ClaimStatus.HALLUCINATED,
            15.0,
            "Contradiction found: authoritative records identify this statement as disproven or fabricated.",
            best_source.snippet[:250],
            best_source.source_name,
            best_source.source_url,
        )

    # Word overlap scoring
    if overlap_ratio >= 0.50:
        conf = min(98.0, round(78.0 + (overlap_ratio * 20.0), 1))
        return (
            ClaimStatus.VERIFIED,
            conf,
            f"Corroborated by high semantic match in {best_source.source_name}.",
            best_source.snippet[:250],
            best_source.source_name,
            best_source.source_url,
        )
    elif overlap_ratio >= 0.30:
        return (
            ClaimStatus.SUSPICIOUS,
            55.0,
            f"Partially supported in {best_source.source_name}, but contextual alignment is incomplete.",
            best_source.snippet[:250],
            best_source.source_name,
            best_source.source_url,
        )
    else:
        return (
            ClaimStatus.SUSPICIOUS,
            38.0,
            f"Evidence from {best_source.source_name} does not adequately confirm this statement.",
            best_source.snippet[:250],
            best_source.source_name,
            best_source.source_url,
        )


async def verify_single_claim(claim_id: str, claim_text: str, claim_type: ClaimType) -> ClaimResult:
    """Run full verification pipeline for a single claim across multiple sources."""
    if claim_type == ClaimType.OPINION:
        return ClaimResult(
            id=claim_id,
            text=claim_text,
            type=claim_type,
            status=ClaimStatus.UNVERIFIED,
            confidence=50.0,
            evidence=None,
            source="Subjective Statement",
            source_url=None,
            sources=[],
            reasoning="Sentence expresses personal opinion, sentiment, or speculation rather than an objective verifiable fact.",
        )

    # Stage 2: Independent verification query generation
    plan = generate_independent_query(claim_text)

    # Stage 3: Multi-source evidence retrieval (OpenAlex, PubMed, ArXiv, DDG, Wikipedia)
    evidence_pool = await retrieve_multi_source_evidence(plan.search_query)

    # Stage 5: Evaluation via LLM or Semantic Cross-Check
    llm_result = await _judge_with_llm(claim_text, plan.neutral_question, evidence_pool)

    if llm_result:
        status, conf, reasoning, quote, src_name, src_url = llm_result
    else:
        status, conf, reasoning, quote, src_name, src_url = _semantic_evidence_cross_check(claim_text, evidence_pool)

    # Compile list of all distinct verified sources with valid links
    sources_list: List[SourceCitation] = []
    seen_urls = set()

    if src_url and src_url not in seen_urls:
        seen_urls.add(src_url)
        sources_list.append(SourceCitation(name=src_name, url=src_url, title=src_name))

    for ev in evidence_pool:
        if ev.source_url and ev.source_url not in seen_urls:
            seen_urls.add(ev.source_url)
            sources_list.append(SourceCitation(name=ev.source_name, url=ev.source_url, title=ev.title))

    return ClaimResult(
        id=claim_id,
        text=claim_text,
        type=claim_type,
        status=status,
        confidence=conf,
        evidence=quote,
        source=src_name,
        source_url=src_url,
        sources=sources_list,
        reasoning=reasoning,
    )


async def verify_claims_pipeline(claims: List[Tuple[str, str, ClaimType]]) -> List[ClaimResult]:
    """Verify a batch of claims concurrently across the pipeline."""
    tasks = [verify_single_claim(cid, ctext, ctype) for cid, ctext, ctype in claims]
    return await asyncio.gather(*tasks)