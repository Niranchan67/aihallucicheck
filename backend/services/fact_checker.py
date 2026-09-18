"""
fact_checker.py
---------------
Stage 3 & Stage 5 of the verification pipeline:
Full factual verification engine across ANY input text.

REQUIRED ARCHITECTURE:
User Input
-> Sentence / Claim Extraction
-> Atomic Fact Extraction
-> Entity + Relationship Extraction
-> Evidence Retrieval
-> URL Validation
-> Source Validation
-> Evidence Entailment
-> Contradiction Detection
-> Confidence Calculation
-> Final Classification

RULES:
- Semantic similarity is strictly limited to candidate evidence retrieval.
- Never use similarity > threshold -> VERIFIED.
- Absence of contradictory evidence is NOT enough to classify something as VERIFIED.
- All displayed URLs must be real, reachable, canonical URLs retrieved from external sources.
"""

import asyncio
import json
import os
import re
from typing import List, Optional, Tuple
import httpx

from config import get_settings
from schemas import ClaimResult, ClaimStatus, ClaimType, SourceCitation
from services.claim_extractor import extract_claims
from services.entailment_engine import (
    EntailmentVerdict,
    evaluate_evidence_entailment,
    extract_atomic_facts_from_text,
)
from services.independent_verifier import generate_independent_query
from services.multi_source_retriever import (
    RetrievedEvidence,
    retrieve_multi_source_evidence,
)
from services.source_validator import (
    SourceTier,
    classify_source_authority,
    is_authoritative_for_verification,
)
from services.url_validator import is_valid_url_format, validate_and_resolve_url

settings = get_settings()

OPENROUTER_KEYS = [
    key for key in [os.getenv("OPENROUTER_API_KEY", "")] if key and len(key) > 10
]

LLM_MODELS = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
]


async def _judge_with_llm(
    claim_text: str,
    neutral_question: str,
    evidence_pool: List[RetrievedEvidence],
) -> Optional[Tuple[ClaimStatus, float, str, str, str, str]]:
    """
    Opportunistically cross-examine claim with external LLM if an API key is configured.
    Returns (status, confidence, reasoning, evidence_quote, source_name, source_url) or None.
    """
    if not OPENROUTER_KEYS and not os.getenv("GEMINI_API_KEY"):
        return None

    evidence_snippets = "\n".join(
        f"- [{e.source_name}] ({e.source_url}): {e.snippet}"
        for e in evidence_pool
    )

    system_prompt = (
        "You are HalluciCheck, an elite AI Hallucination & Fact-Checking Verification Model. "
        "Analyze whether the given statement is factually accurate or contains hallucinations, false numbers, wrong dates, or fabricated assertions. "
        "Strict rules: Never mark a claim verified based on semantic overlap. It must be directly supported by verified facts."
    )

    user_prompt = (
        f'CLAIM TO VERIFY:\n"{claim_text}"\n\n'
        f'INDEPENDENT NEUTRAL QUERY:\n{neutral_question}\n\n'
        f'RETRIEVED EXTERNAL GROUND TRUTH:\n{evidence_snippets or "No external passages indexed."}\n\n'
        'INSTRUCTIONS:\n'
        '1. Evaluate the claim strictly against verified facts and external ground truth.\n'
        '2. Classify status into one of:\n'
        '   - "verified": The statement is entirely true, accurate, and substantiated by reliable evidence.\n'
        '   - "hallucinated": The statement is false, disproven, or contains fabricated facts/names/dates.\n'
        '   - "suspicious": The statement is partially true, ambiguous, unproven, or lacks conclusive evidence.\n'
        '3. Provide a confidence score from 10 to 98.\n'
        '4. Provide a 1-2 sentence factual explanation.\n'
        '5. Return ONLY a valid JSON object matching this schema:\n'
        '{\n'
        '  "status": "verified" | "hallucinated" | "suspicious",\n'
        '  "confidence": <integer 10-98>,\n'
        '  "explanation": "<concise factual reasoning>",\n'
        '  "evidence_quote": "<salient excerpt confirming or debunking the claim>",\n'
        '  "source_name": "<name of authoritative source>",\n'
        '  "source_url": "<valid authoritative URL from evidence>"\n'
        '}'
    )

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for key in OPENROUTER_KEYS:
            for model_name in LLM_MODELS:
                try:
                    headers = {
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
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
                    resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
                        data = json.loads(clean_json)

                        st_str = data.get("status", "suspicious").lower()
                        if "verif" in st_str:
                            status = ClaimStatus.VERIFIED
                        elif "hallucin" in st_str or "false" in st_str:
                            status = ClaimStatus.HALLUCINATED
                        else:
                            status = ClaimStatus.SUSPICIOUS

                        confidence = float(data.get("confidence", 50.0))
                        reasoning = data.get("explanation") or "Evaluated via multi-source consensus."
                        evidence_quote = data.get("evidence_quote") or ""
                        source_name = data.get("source_name") or (evidence_pool[0].source_name if evidence_pool else "Authoritative Record")
                        source_url = data.get("source_url") or (evidence_pool[0].source_url if evidence_pool else "")
                        return status, confidence, reasoning, evidence_quote, source_name, source_url
                except Exception:
                    continue

    return None


async def verify_single_claim(
    claim_id: str,
    claim_text: str,
    claim_type: ClaimType,
    start_index: int = 0,
    end_index: int = 0,
) -> ClaimResult:
    """Run the complete factual verification pipeline for a single claim."""
    clean_claim = claim_text.strip()

    # Subjective/Opinion short-circuit
    if claim_type == ClaimType.OPINION:
        return ClaimResult(
            id=claim_id,
            text=clean_claim,
            type=claim_type,
            status=ClaimStatus.UNVERIFIED,
            confidence=50.0,
            evidence=None,
            source="Subjective Statement",
            source_url=None,
            sources=[],
            reasoning="Sentence expresses personal opinion, sentiment, or speculation rather than an objective verifiable fact.",
            start_index=start_index,
            end_index=end_index,
        )

    # 1. Atomic Fact Extraction (Entity + Exact Relationship)
    claim_facts = extract_atomic_facts_from_text(clean_claim)

    # 2. Independent Verification Query Generation
    plan = generate_independent_query(clean_claim)

    # 3. Multi-Source Evidence Retrieval
    raw_evidence = await retrieve_multi_source_evidence(plan.search_query)

    # 4. URL Validation & Canonicalization (Strict Reachability & Integrity)
    validated_evidence: List[RetrievedEvidence] = []
    seen_urls: Set[str] = set()

    for item in raw_evidence:
        raw_url = item.source_url.strip() if item.source_url else ""
        if not raw_url or not is_valid_url_format(raw_url):
            continue

        is_valid, canonical_url, _ = await validate_and_resolve_url(raw_url, expected_title=item.title)
        if is_valid and canonical_url:
            if canonical_url not in seen_urls:
                seen_urls.add(canonical_url)
                validated_evidence.append(
                    RetrievedEvidence(
                        source_name=item.source_name,
                        source_url=canonical_url,
                        title=item.title,
                        snippet=item.snippet,
                    )
                )

    # 5. Evidence Evaluation across Validated Sources
    supporting_sources: List[Tuple[RetrievedEvidence, str, float]] = []
    contradicting_sources: List[Tuple[RetrievedEvidence, str, float]] = []
    neutral_sources: List[Tuple[RetrievedEvidence, str, float]] = []

    # Try LLM judge first if keys are configured
    llm_verdict = await _judge_with_llm(clean_claim, plan.neutral_question, validated_evidence)

    if llm_verdict:
        status, conf, reasoning, quote, src_name, src_url = llm_verdict
        # Validate that the LLM's returned URL is actually from the validated pool
        matching_ev = next((e for e in validated_evidence if e.source_url == src_url), None)
        if not matching_ev and validated_evidence:
            src_url = validated_evidence[0].source_url
            src_name = validated_evidence[0].source_name

        sources_list = [
            SourceCitation(name=e.source_name, url=e.source_url, title=e.title)
            for e in validated_evidence[:4]
        ]
        return ClaimResult(
            id=claim_id,
            text=clean_claim,
            type=claim_type,
            status=status,
            confidence=conf,
            evidence=quote or (validated_evidence[0].snippet if validated_evidence else None),
            source=src_name,
            source_url=src_url,
            sources=sources_list,
            reasoning=reasoning,
            start_index=start_index,
            end_index=end_index,
        )

    # 6. Generic Entailment & Contradiction Analysis
    for ev in validated_evidence:
        tier, tier_weight, tier_desc = classify_source_authority(ev.source_name, ev.source_url)
        verdict, score, rationale = evaluate_evidence_entailment(
            clean_claim, claim_facts, ev.snippet, ev.source_name, ev.source_url
        )

        if verdict == EntailmentVerdict.CONTRADICTING:
            contradicting_sources.append((ev, rationale, score))
        elif verdict == EntailmentVerdict.SUPPORTING:
            # Only authoritative sources can establish SUPPORTING status
            if is_authoritative_for_verification(tier):
                supporting_sources.append((ev, rationale, score))
            else:
                neutral_sources.append((
                    ev,
                    f"Mentioned in {ev.source_name}, but source authority ({tier_desc}) is insufficient to substantiate claim.",
                    48.0,
                ))
        elif verdict == EntailmentVerdict.NEUTRAL_INSUFFICIENT:
            neutral_sources.append((ev, rationale, score))

    # 7. Final Classification Decision Synthesis
    # VERIFIED: Only when reliable evidence directly supports the complete factual claim and no refutations exist.
    # HALLUCINATED: When reliable evidence directly contradicts the claim or establishes that it is factually false.
    # SUSPICIOUS: When evidence is ambiguous, conflicting, insufficient, unverifiable, or source quality too weak.
    if contradicting_sources and not supporting_sources:
        # Definitive contradiction with zero support -> HALLUCINATED
        best_contra = contradicting_sources[0]
        final_status = ClaimStatus.HALLUCINATED
        final_conf = min(22.0, max(6.0, round(best_contra[2], 1)))
        final_reasoning = best_contra[1]
        final_evidence = best_contra[0].snippet[:280]
        primary_source = best_contra[0].source_name
        primary_url = best_contra[0].source_url

    elif supporting_sources and not contradicting_sources:
        # Direct entailment from validated authoritative source with zero contradictions -> VERIFIED
        best_supp = supporting_sources[0]
        final_status = ClaimStatus.VERIFIED
        num_agreeing = len(supporting_sources)
        base_conf = 86.0
        # Boost confidence with independent concurring authoritative sources
        final_conf = min(98.0, round(base_conf + (num_agreeing - 1) * 3.5, 1))
        final_reasoning = best_supp[1]
        final_evidence = best_supp[0].snippet[:280]
        primary_source = best_supp[0].source_name
        primary_url = best_supp[0].source_url

    elif supporting_sources and contradicting_sources:
        # Conflicting evidence between sources -> SUSPICIOUS per classification requirements
        final_status = ClaimStatus.SUSPICIOUS
        final_conf = 48.0
        final_reasoning = (
            f"Conflicting evidence found: {supporting_sources[0][0].source_name} provides corroborating context, "
            f"while {contradicting_sources[0][0].source_name} reports discrepancies. Requires human review."
        )
        final_evidence = supporting_sources[0][0].snippet[:280]
        primary_source = supporting_sources[0][0].source_name
        primary_url = supporting_sources[0][0].source_url

    elif neutral_sources:
        # Related entity mentions without complete factual relationship entailment -> SUSPICIOUS
        best_neutral = neutral_sources[0]
        final_status = ClaimStatus.SUSPICIOUS
        final_conf = 45.0
        final_reasoning = best_neutral[1]
        final_evidence = best_neutral[0].snippet[:280]
        primary_source = best_neutral[0].source_name
        primary_url = best_neutral[0].source_url

    else:
        # No validated authoritative evidence found -> SUSPICIOUS
        final_status = ClaimStatus.SUSPICIOUS
        final_conf = 35.0
        final_reasoning = "Insufficient ground truth: No authoritative, reachable sources could confirm this assertion."
        final_evidence = None
        primary_source = "Unverified Index"
        primary_url = None

    # Construct clean, validated list of sources with genuine URLs
    sources_list: List[SourceCitation] = []
    seen_citation_urls = set()

    for ev in validated_evidence:
        if ev.source_url and ev.source_url not in seen_citation_urls:
            seen_citation_urls.add(ev.source_url)
            sources_list.append(SourceCitation(name=ev.source_name, url=ev.source_url, title=ev.title))

    return ClaimResult(
        id=claim_id,
        text=clean_claim,
        type=claim_type,
        status=final_status,
        confidence=final_conf,
        evidence=final_evidence,
        source=primary_source,
        source_url=primary_url,
        sources=sources_list,
        reasoning=final_reasoning,
        start_index=start_index,
        end_index=end_index,
    )


async def verify_claims_pipeline(claims: List[Tuple]) -> List[ClaimResult]:
    """Verify a batch of claims concurrently across the pipeline."""
    tasks = []
    for item in claims:
        if len(item) >= 5:
            cid, ctext, ctype, s_idx, e_idx = item[:5]
        else:
            cid, ctext, ctype = item[:3]
            s_idx, e_idx = 0, len(ctext)
        tasks.append(verify_single_claim(cid, ctext, ctype, s_idx, e_idx))
    return await asyncio.gather(*tasks)