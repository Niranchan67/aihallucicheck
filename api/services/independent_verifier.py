"""
independent_verifier.py
-----------------------
Stage 2: Adaptive Query & Contradiction Generator.

Generates multi-perspective, decontextualized search formulations to:
1. Neutralize confirmation bias.
2. Probe specific subclaims and atomic propositions.
3. Actively search for contradictory evidence, official corrections, and refutations.
4. Provide adaptive fallbacks (broader/narrower queries) for evidence sufficiency retries.
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional
from services.claim_analyzer import AnalyzedClaim, AtomicProposition, InternalClaimType

_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "with", "by", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "from",
    "up", "down", "out", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
    "will", "just", "don", "should", "now", "it", "its", "that", "this", "these", "those"
}


@dataclass
class AdaptiveQuerySet:
    claim_text: str
    neutral_question: str
    primary_query: str
    structured_query: str
    subclaim_queries: List[str] = field(default_factory=list)
    contradiction_queries: List[str] = field(default_factory=list)
    broad_fallback_query: str = ""
    key_entities: List[str] = field(default_factory=list)


# Backward compatibility alias
VerificationPlan = AdaptiveQuerySet


def generate_independent_query(claim_text: str, analyzed_claim: Optional[AnalyzedClaim] = None) -> AdaptiveQuerySet:
    """
    Constructs a comprehensive suite of adaptive queries:
    - Primary neutral query
    - Specific proposition queries
    - Active contradiction search queries (discovering false dates, wrong attributions, debunked assertions)
    - Broad fallback query for sufficiency retries
    """
    clean = claim_text.strip()
    clean = re.sub(r'\([A-Za-z\s]+,?\s*\d{4}\)', '', clean).strip()

    # Extract entities and numbers
    entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', clean)
    numbers = re.findall(r'\b\d{1,4}(?:\.\d+)?%?\b', clean)
    years = re.findall(r'\b(1[6-9]\d{2}|20\d{2})\b', clean)

    words = re.findall(r'\b[A-Za-z0-9\-_]{3,}\b', clean)
    keywords = [w for w in words if w.lower() not in _STOP_WORDS]

    # Build primary query
    primary_parts = []
    for ent in entities:
        if ent not in primary_parts:
            primary_parts.append(ent)
    for num in numbers:
        if num not in primary_parts:
            primary_parts.append(num)
    for kw in keywords:
        if kw not in primary_parts and len(primary_parts) < 6:
            primary_parts.append(kw)

    primary_query = " ".join(primary_parts[:6]) if primary_parts else clean

    # Neutral question formulation
    if any(re.search(r'\b(invented|discovered|founded|created|developed|built)\b', clean, re.I) for _ in [1]):
        neutral_question = f"What are the historical facts and origin regarding: {primary_query}?"
    elif numbers:
        neutral_question = f"What are the verified statistics or measurements regarding: {primary_query}?"
    else:
        neutral_question = f"What is the factual consensus regarding {primary_query}?"

    subclaim_queries: List[str] = []
    contradiction_queries: List[str] = []

    # If analyzed claim is provided, use atomic propositions and refine primary query
    if analyzed_claim:
        subj = analyzed_claim.subject_entity
        pred = analyzed_claim.predicate_action
        obj = analyzed_claim.object_value

        # Formulate precise primary query from core semantic tuple
        if subj and obj:
            clean_obj = re.sub(r'^(the|a|an)\s+', '', obj, flags=re.IGNORECASE).strip()
            parts = [subj, pred, clean_obj]
            if years:
                parts.append(years[0])
            primary_query = " ".join(parts)
            structured_query = f"{subj} {clean_obj}"
        elif subj:
            structured_query = f"{subj} {pred}"
        else:
            structured_query = primary_query

        for prop in analyzed_claim.atomic_propositions:
            if prop.prop_type == "reason":
                # Subclaim query for the asserted reason
                subclaim_queries.append(f"{subj} {obj} {prop.value}".strip())
                # Contradiction query: ask for the real reason / official citation
                contradiction_queries.append(f"{subj} {obj} citation official reason award".strip())
                contradiction_queries.append(f"{subj} {obj} why awarded".strip())

            elif prop.prop_type == "date":
                # Subclaim query
                subclaim_queries.append(f"{subj} {obj} {prop.value}".strip())
                # Contradiction query: search without year to find conflicting year
                contradiction_queries.append(f"{subj} {obj} date year timeline".strip())

            elif prop.prop_type == "category":
                subclaim_queries.append(f"{subj} {obj} {prop.value}".strip())

            elif prop.prop_type == "attribution":
                subclaim_queries.append(f"{obj} {prop.value}".strip())
                contradiction_queries.append(f"who created {obj}".strip())
                contradiction_queries.append(f"{obj} original author creator".strip())

    # Universal contradiction queries for creation, invention, and authoring
    if any(w in clean.lower() for w in ["invented", "discovered", "created", "founded", "wrote", "designed", "developed"]):
        target_obj = ""
        if analyzed_claim and analyzed_claim.object_value:
            target_obj = analyzed_claim.object_value
        elif len(entities) >= 2:
            target_obj = entities[1]
        elif entities:
            target_obj = entities[0]
        
        if target_obj:
            clean_obj = re.sub(r'^(the|a|an)\s+', '', target_obj, flags=re.IGNORECASE).strip()
            contradiction_queries.append(clean_obj)
            contradiction_queries.append(f"who invented {clean_obj}")
            contradiction_queries.append(f"{clean_obj} creator author")

    # Universal contradiction queries for prizes and awards
    if any(w in clean.lower() for w in ["nobel", "prize", "award", "medal", "oscar"]):
        target_subj = analyzed_claim.subject_entity if (analyzed_claim and analyzed_claim.subject_entity) else (entities[0] if entities else "")
        if target_subj:
            contradiction_queries.append(f"{target_subj} nobel prize official citation reason")
            contradiction_queries.append(f"{target_subj} prize year citation")

    # Capital city contradiction probe
    if "capital" in clean.lower():
        country_match = re.search(r"\bcapital\s+(?:city\s+)?of\s+([A-Za-z]+)\b", clean, re.I)
        if not country_match:
            country_match = re.search(r"\b([A-Za-z]+)\'s\s+capital\b", clean, re.I)
        if country_match:
            country_name = country_match.group(1).strip()
            contradiction_queries.append(f"what is the capital of {country_name}")
            contradiction_queries.append(f"capital city of {country_name} official")

    # General refutation / debunking probe for extraordinary or physics-defying claims
    if any(w in clean.lower() for w in ["faster than light", "miracle", "perpetual motion", "telepathy", "alien", "cure for all"]):
        contradiction_queries.append(f"{primary_query} debunked myth disproven")

    # Broad fallback query (just core entity and core topic)
    broad_fallback_query = " ".join(entities[:2] + keywords[:2]) if entities else " ".join(keywords[:4])

    return AdaptiveQuerySet(
        claim_text=claim_text,
        neutral_question=neutral_question,
        primary_query=primary_query,
        structured_query=structured_query,
        subclaim_queries=subclaim_queries[:3],
        contradiction_queries=contradiction_queries[:3],
        broad_fallback_query=broad_fallback_query,
        key_entities=entities[:4],
    )
