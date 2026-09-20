"""
fact_checker.py
---------------
Core Factual Verification Orchestrator:
Coordinates the complete 18-stage evidence-grounded verification pipeline:

User Input
-> Stage 1: Claim Understanding & 11-Class Taxonomy (claim_analyzer.py)
-> Stage 2: Atomic Fact Decomposition (Entity -> Relation -> Value / Qualifiers)
-> Stage 3: Adaptive Query Generation (independent_verifier.py)
-> Stage 4: Active Contradiction Search Generation
-> Stage 5: Multi-Source Evidence Retrieval (OpenAlex, CrossRef, PubMed, ArXiv, Live Web, Wikidata, Wikipedia)
-> Stage 6: URL Validation & Reachability Probe (url_validator.py)
-> Stage 7: Source Quality & Relevance Filtering (source_validator.py)
-> Stage 8: Adaptive Retrieval Fallback / Retry on Insufficient Evidence
-> Stage 9: Proposition-Level Evidence Entailment & Sufficiency Analysis (entailment_engine.py)
-> Stage 10: Consensus Aggregation & Duplicate/Syndication Suppression
-> Stage 11: Deterministic Multi-Criteria Classification (VERIFIED, SUSPICIOUS, HALLUCINATED)
-> Stage 12: Evidence-Grounded Confidence Calibration & Transparent Rationale Generation
"""

import asyncio
import re
from typing import List, Optional, Set, Tuple

from config import get_settings
from schemas import ClaimResult, ClaimStatus, ClaimType, SourceCitation
from services.claim_analyzer import (
    AnalyzedClaim,
    InternalClaimType,
    analyze_claim,
)
from services.entailment_engine import (
    EvidenceRelation,
    PropositionVerificationReport,
    SufficiencyState,
    evaluate_complete_claim_propositions,
)
from services.independent_verifier import generate_independent_query
from services.multi_source_retriever import (
    RetrievedEvidence,
    retrieve_multi_source_evidence,
)
from services.source_validator import (
    classify_source_authority,
    evaluate_source_relevance,
    is_authoritative_for_verification,
)
from services.url_validator import is_valid_url_format, validate_and_resolve_url

settings = get_settings()


def map_internal_to_claim_type(internal_type: InternalClaimType) -> ClaimType:
    """Maps rich internal 11-category taxonomy to frontend-compatible ClaimType."""
    if internal_type in (InternalClaimType.OPINION_OR_SUBJECTIVE, InternalClaimType.NON_FACTUAL_TEXT):
        return ClaimType.OPINION
    elif internal_type in (InternalClaimType.QUANTITATIVE_FACT, InternalClaimType.TEMPORAL_FACT):
        return ClaimType.STATISTICAL
    elif internal_type in (InternalClaimType.HISTORICAL_FACT, InternalClaimType.BIOGRAPHICAL_FACT):
        return ClaimType.HISTORICAL
    else:
        return ClaimType.FACTUAL


async def verify_single_claim(
    claim_id: str,
    claim_text: str,
    claim_type: ClaimType,
    start_index: int = 0,
    end_index: int = 0,
) -> ClaimResult:
    """
    Executes the full LLM-style evidence verification pipeline on a single claim.
    """
    clean_claim = claim_text.strip()

    # 1. Stage 1 & 2: Claim Understanding & Atomic Proposition Decomposition
    analyzed: AnalyzedClaim = analyze_claim(
        claim_id=claim_id,
        claim_text=clean_claim,
        start_index=start_index,
        end_index=end_index,
    )

    frontend_type = map_internal_to_claim_type(analyzed.internal_type)

    # Short-circuit for opinions / subjective assertions
    if analyzed.is_opinion or analyzed.internal_type == InternalClaimType.OPINION_OR_SUBJECTIVE:
        return ClaimResult(
            id=claim_id,
            text=clean_claim,
            type=frontend_type,
            status=ClaimStatus.UNVERIFIED,
            confidence=50.0,
            evidence=None,
            source="Subjective Statement",
            source_url=None,
            sources=[],
            reasoning="Sentence expresses subjective sentiment, personal taste, or speculation rather than an objective verifiable fact.",
            start_index=start_index,
            end_index=end_index,
        )

    # 2. Stage 3 & 4: Adaptive Query Formulation & Contradiction Query Generation
    query_set = generate_independent_query(clean_claim, analyzed_claim=analyzed)

    # 3. Stage 5: Concurrent Multi-Source Evidence Retrieval
    # Queries OpenAlex, CrossRef, PubMed, ArXiv, DuckDuckGo Live Web, Wikidata, and Wikipedia
    raw_evidence: List[RetrievedEvidence] = await retrieve_multi_source_evidence(
        query=query_set.primary_query,
        subclaim_queries=query_set.subclaim_queries,
        contradiction_queries=query_set.contradiction_queries,
        broad_fallback_query=query_set.broad_fallback_query,
    )

    # 4. Stage 6: URL Validation & Canonicalization (Strict Reachability & Integrity)
    # Rejects malformed or unreachable URLs; follows redirects to canonical landing pages
    validated_evidence: List[RetrievedEvidence] = []
    seen_urls: Set[str] = set()

    for item in raw_evidence:
        raw_url = item.source_url.strip() if item.source_url else ""
        if not raw_url or not is_valid_url_format(raw_url):
            continue

        is_valid, canonical_url, _ = await validate_and_resolve_url(raw_url, expected_title=item.title)
        if is_valid and canonical_url and canonical_url not in seen_urls:
            seen_urls.add(canonical_url)
            validated_evidence.append(
                RetrievedEvidence(
                    source_name=item.source_name,
                    source_url=canonical_url,
                    title=item.title,
                    snippet=item.snippet,
                    is_contradiction_probe=item.is_contradiction_probe,
                    source_domain=item.source_domain,
                    publication_year=item.publication_year,
                    is_secondary=item.is_secondary,
                )
            )

    # 5. Stage 7: Source Quality & Relevance Filtering
    # CRITICAL RULE: High authority source that is irrelevant to the claim is NOT evidence.
    all_claim_terms = set()
    for prop in analyzed.atomic_propositions:
        all_claim_terms.update(prop.content_terms)

    materially_relevant_evidence: List[RetrievedEvidence] = []
    for ev in validated_evidence:
        # Check relevance to claim
        is_relevant, rel_score = evaluate_source_relevance(
            claim_terms=all_claim_terms,
            entities=analyzed.entities,
            snippet=ev.snippet,
            title=ev.title,
        )

        # Allow Wikidata or contradiction probes if they mention subject
        if is_relevant or ev.is_contradiction_probe or "wikidata" in ev.source_domain:
            materially_relevant_evidence.append(ev)

    # 6. Stage 8: Adaptive Retrieval Retry
    # If no materially relevant evidence was found, retry with broad fallback query
    if not materially_relevant_evidence and query_set.broad_fallback_query:
        fallback_raw = await retrieve_multi_source_evidence(
            query=query_set.broad_fallback_query,
            subclaim_queries=[],
            contradiction_queries=[],
        )
        for item in fallback_raw:
            if item.source_url and item.source_url not in seen_urls and is_valid_url_format(item.source_url):
                is_valid, canonical_url, _ = await validate_and_resolve_url(item.source_url, expected_title=item.title)
                if is_valid and canonical_url and canonical_url not in seen_urls:
                    seen_urls.add(canonical_url)
                    materially_relevant_evidence.append(
                        RetrievedEvidence(
                            source_name=item.source_name,
                            source_url=canonical_url,
                            title=item.title,
                            snippet=item.snippet,
                            source_domain=item.source_domain,
                            is_secondary=item.is_secondary,
                        )
                    )

    # 7. Stage 9 & 10: Proposition-Level Evidence Entailment & Sufficiency Analysis
    prop_report: PropositionVerificationReport = evaluate_complete_claim_propositions(
        claim_text=clean_claim,
        evidence_pool=materially_relevant_evidence,
        analyzed_claim=analyzed,
    )

    final_status = prop_report.final_status
    final_conf = prop_report.confidence
    final_reasoning = prop_report.rationale
    final_evidence = prop_report.primary_evidence_quote
    primary_source = prop_report.primary_source_name or "Authoritative Consensus"
    primary_url = prop_report.primary_source_url

    # 8. Stage 11: Construct Clean Citation List (Reachable, Distinct Domains Only)
    sources_list: List[SourceCitation] = []
    seen_citation_domains = set()

    for ev in materially_relevant_evidence:
        dom = ev.source_domain or ev.source_url
        if dom not in seen_citation_domains and len(sources_list) < 5:
            seen_citation_domains.add(dom)
            sources_list.append(SourceCitation(name=ev.source_name, url=ev.source_url, title=ev.title))

    return ClaimResult(
        id=claim_id,
        text=clean_claim,
        type=frontend_type,
        status=final_status,
        confidence=final_conf,
        evidence=final_evidence,
        source=primary_source,
        source_url=primary_url,
        sources=sources_list,
        reasoning=final_reasoning,
        propositions_evaluated=prop_report.propositions_evaluated,
        authority_checks=prop_report.authority_checks,
        evidence_proofs=prop_report.evidence_proofs,
        contradiction_details=prop_report.contradiction_details,
        start_index=start_index,
        end_index=end_index,
    )


async def verify_claims_pipeline(claims: List[Tuple]) -> List[ClaimResult]:
    """Concurrently verifies a batch of claims across the complete factual pipeline."""
    tasks = []
    for item in claims:
        if len(item) >= 5:
            cid, ctext, ctype, s_idx, e_idx = item[:5]
        else:
            cid, ctext, ctype = item[:3]
            s_idx, e_idx = 0, len(ctext)
        tasks.append(verify_single_claim(cid, ctext, ctype, s_idx, e_idx))
    return await asyncio.gather(*tasks)